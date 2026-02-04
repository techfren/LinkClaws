#!/bin/bash
#
# OCI VM.Standard.A1.Flex Provisioning Script
# Creates an ARM-based VM in availability domain AD-1
#

set -e

# --- Configuration ---
COMPARTMENT_ID="${OCI_COMPARTMENT_ID}"
AVAILABILITY_DOMAIN="AD-1"  # Change if needed for your region
SUBNET_CIDR="10.0.0.0/24"
INSTANCE_NAME="arm-vm-ad1"
IMAGE_ID="ocid1.image.oc1.phx.aaaaaaaa..."  # Replace with actual image OCID
SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-~/.ssh/id_rsa.pub}"
SHAPE="VM.Standard.A1.Flex"
CPU_OCPUS=2
MEMORY_GB=12

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Prerequisites ---
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check OCI CLI
    if ! command -v oci &> /dev/null; then
        log_warn "OCI CLI not found. Installing..."
        bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
    fi

    # Check SSH key
    if [ ! -f "$SSH_PUBLIC_KEY" ]; then
        log_error "SSH public key not found at $SSH_PUBLIC_KEY"
        log_info "Generating new SSH key..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
        SSH_PUBLIC_KEY="~/.ssh/id_rsa.pub"
    fi

    log_info "Prerequisites satisfied."
}

# --- Configuration ---
configure_oci() {
    if [ -z "$COMPARTMENT_ID" ]; then
        log_info "Getting default compartment ID..."
        COMPARTMENT_ID=$(oci iam compartment list --query "data[?contains(\"$(oci iam user get --name Oracletn7 --raw-output 2>/dev/null || echo 'root')\"] | [0].id" --raw-output 2>/dev/null || oci iam compartment list --all --query "data[0].id" --raw-output)
        
        if [ -z "$COMPARTMENT_ID" ]; then
            log_error "COMPARTMENT_ID not set and couldn't auto-detect."
            log_info "Please set OCI_COMPARTMENT_ID environment variable or configure via 'oci setup config'"
            exit 1
        fi
    fi
    log_info "Using Compartment ID: $COMPARTMENT_ID"
}

# --- Networking ---
create_vcn() {
    local VCN_NAME="${INSTANCE_NAME}-vcn"
    log_info "Checking for existing VCN..."

    local VCN_ID=$(oci network vcn list --compartment-id "$COMPARTMENT_ID" \
        --query "data[?contains(\"display-name\", '$VCN_NAME')].id | [0]" --raw-output 2>/dev/null || echo "")

    if [ -z "$VCN_ID" ] || [ "$VCN_ID" = "None" ]; then
        log_info "Creating VCN..."
        VCN_ID=$(oci network vcn create \
            --compartment-id "$COMPARTMENT_ID" \
            --display-name "$VCN_NAME" \
            --cidr-block "10.0.0.0/16" \
            --query "data.id" --raw-output)
        log_info "VCN created: $VCN_ID"
    else
        log_info "VCN already exists: $VCN_ID"
    fi
    echo "$VCN_ID"
}

create_subnet() {
    local VCN_ID=$1
    local SUBNET_NAME="${INSTANCE_NAME}-subnet"
    
    log_info "Checking for existing subnet..."

    local SUBNET_ID=$(oci network subnet list \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --query "data[?contains(\"display-name\", '$SUBNET_NAME')].id | [0]" --raw-output 2>/dev/null || echo "")

    if [ -z "$SUBNET_ID" ] || [ "$SUBNET_ID" = "None" ]; then
        log_info "Creating subnet in $AVAILABILITY_DOMAIN..."
        SUBNET_ID=$(oci network subnet create \
            --compartment-id "$COMPARTMENT_ID" \
            --vcn-id "$VCN_ID" \
            --display-name "$SUBNET_NAME" \
            --cidr-block "$SUBNET_CIDR" \
            --availability-domain "$AVAILABILITY_DOMAIN" \
            --query "data.id" --raw-output)
        log_info "Subnet created: $SUBNET_ID"
    else
        log_info "Subnet already exists: $SUBNET_ID"
    fi
    echo "$SUBNET_ID"
}

create_security_list() {
    local SUBNET_ID=$1
    local SECLIST_NAME="${INSTANCE_NAME}-seclist"

    log_info "Checking for existing security list..."

    local SECLIST_ID=$(oci network security-list list \
        --compartment-id "$COMPARTMENT_ID" \
        --subnet-id "$SUBNET_ID" \
        --query "data[0].id" --raw-output 2>/dev/null || echo "")

    if [ -z "$SECLIST_ID" ] || [ "$SECLIST_ID" = "None" ]; then
        log_info "Creating security list..."
        SECLIST_ID=$(oci network security-list create \
            --compartment-id "$COMPARTMENT_ID" \
            --subnet-id "$SUBNET_ID" \
            --display-name "$SECLIST_NAME" \
            --ingress-security-rules '[{"source": "0.0.0.0/0", "protocol": "6", "description": "SSH", "destination": null, "isStateless": false, "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}}]' \
            --egress-security-rules '[{"destination": "0.0.0.0/0", "protocol": "all", "description": "All traffic", "isStateless": false}]' \
            --query "data.id" --raw-output)
        log_info "Security list created: $SECLIST_ID"
    else
        log_info "Security list already exists: $SECLIST_ID"
    fi
}

# --- Instance ---
get_image_id() {
    if [ -z "$IMAGE_ID" ] || [ "$IMAGE_ID" = "ocid1.image.oc1.phx.aaaaaaaa..." ]; then
        log_info "Fetching latest Oracle Linux image for A1.Flex..."
        # Oracle Linux 8 (aarch64) in Phoenix region
        IMAGE_ID=$(oci compute image list \
            --compartment-id "$COMPARTMENT_ID" \
            --operating-system "Oracle Linux" \
            --shape "$SHAPE" \
            --sort-by "TIMECREATED" \
            --sort-order "DESC" \
            --query "data[0].id" --raw-output) || \
        IMAGE_ID="ocid1.image.oc1.phx.aaaaaaaa6jlrgacmffwow5bvy5xsphx2wwoorvsspnp2nwyvfrlq"  # Fallback
    fi
    log_info "Using Image ID: $IMAGE_ID"
}

provision_instance() {
    local SUBNET_ID=$1

    log_info "Checking for existing instance..."

    local INSTANCE_ID=$(oci compute instance list \
        --compartment-id "$COMPARTMENT_ID" \
        --display-name "$INSTANCE_NAME" \
        --query "data[0].id" --raw-output 2>/dev/null || echo "")

    if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
        log_warn "Instance already exists: $INSTANCE_ID"
        log_info "Getting instance details..."
        oci compute instance get --instance-id "$INSTANCE_ID" --query "data"
        return
    fi

    log_info "Provisioning VM.Standard.A1.Flex in $AVAILABILITY_DOMAIN..."

    # Get current VNIC info for attachment
    VNIC_CONFIG=$(oci compute instance launch \
        --compartment-id "$COMPARTMENT_ID" \
        --availability-domain "$AVAILABILITY_DOMAIN" \
        --display-name "$INSTANCE_NAME" \
        --image-id "$IMAGE_ID" \
        --shape "$SHAPE" \
        --shape-config "{\"ocpus\": $CPU_OCPUS, \"memoryInGBs\": $MEMORY_GB}" \
        --subnet-id "$SUBNET_ID" \
        --assign-public-ip true \
        --ssh-authorized-keys-file "$SSH_PUBLIC_KEY" \
        --wait-for-state "RUNNING" \
        --query "data.id" --raw-output)

    log_info "Instance provisioned: $VNIC_CONFIG"
    echo "$VNIC_CONFIG"
}

# --- Main ---
main() {
    echo "========================================"
    echo "OCI VM.Standard.A1.Flex Provisioner"
    echo "========================================"

    check_prerequisites
    configure_oci

    local VCN_ID=$(create_vcn)
    local SUBNET_ID=$(create_subnet "$VCN_ID")
    create_security_list "$SUBNET_ID"
    get_image_id

    local INSTANCE_ID=$(provision_instance "$SUBNET_ID")

    echo ""
    echo "========================================"
    log_info "Provisioning Complete!"
    echo "========================================"
    echo "Instance ID: $INSTANCE_ID"
    echo ""
    log_info "To connect:"
    echo "  ssh opc@<PUBLIC_IP>"
    echo ""
    log_info "Useful commands:"
    echo "  oci compute instance get --instance-id $INSTANCE_ID"
    echo "  oci compute instance console-history capture --instance-id $INSTANCE_ID"
}

# Run
main "$@"
