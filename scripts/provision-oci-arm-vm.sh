#!/bin/bash
#
# OCI VM.Standard.A1.Flex Provisioning Script
# Creates an ARM-based VM in availability domain AD-1
#
# Usage:
#   OCI_COMPARTMENT_ID=<ocid> OCI_SUBNET_ID=<ocid> ./provision-oci-arm-vm.sh
#   ./provision-oci-arm-vm.sh <compartment-ocid> <subnet-ocid>
#

set -e

# Suppress OCI warnings
export OCI_CLI_SUPPRESS_FILE_PERMISSIONS_WARNING=true
export SUPPRESS_LABEL_WARNING=true

# --- Configuration ---
# Set these via environment variables or edit directly
COMPARTMENT_ID="${OCI_COMPARTMENT_ID:-${1:-}}"
AVAILABILITY_DOMAIN="${OCI_AVAILABILITY_DOMAIN:-AD-1}"
SUBNET_ID="${OCI_SUBNET_ID:-}"
INSTANCE_NAME="${OCI_INSTANCE_NAME:-arm-vm-ad1}"
IMAGE_ID="${OCI_IMAGE_ID:-}"
SHAPE="VM.Standard.A1.Flex"
CPU_OCPUS=2
MEMORY_GB=12
SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-~/.ssh/id_rsa.pub}"

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
        log_error "COMPARTMENT_ID not set."
        log_info "Usage: OCI_COMPARTMENT_ID=<ocid> OCI_SUBNET_ID=<ocid> $0"
        log_info "Or: $0 <compartment-ocid> <subnet-ocid>"
        exit 1
    fi
    log_info "Using Compartment ID: $COMPARTMENT_ID"
    log_info "Using Availability Domain: $AVAILABILITY_DOMAIN"
    
    if [ -z "$SUBNET_ID" ]; then
        log_error "SUBNET_ID not set."
        log_info "Provide via OCI_SUBNET_ID environment variable or 2nd argument"
        exit 1
    fi
    log_info "Using Subnet ID: $SUBNET_ID"
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
    log_info "This will take 2-5 minutes..."

    # Launch instance
    INSTANCE_ID=$(oci compute instance launch \
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

    log_info "Instance provisioned successfully!"
    echo ""
    echo "Instance ID: $INSTANCE_ID"
    echo ""
    
    # Get public IP
    local VNIC_ID=$(oci compute instance list-vnics \
        --instance-id "$INSTANCE_ID" \
        --query "data[0].id" --raw-output)
    
    local PUBLIC_IP=$(oci network vnic get \
        --vnic-id "$VNIC_ID" \
        --query "data.\"public-ip\"" --raw-output)
    
    if [ -n "$PUBLIC_IP" ]; then
        echo "Public IP: $PUBLIC_IP"
        echo ""
        echo "To connect:"
        echo "  ssh opc@$PUBLIC_IP"
    else
        echo "No public IP assigned. Check OCI Console for details."
    fi
    
    echo ""
    echo "Useful commands:"
    echo "  oci compute instance get --instance-id $INSTANCE_ID"
    echo "  oci compute instance action --instance-id $INSTANCE_ID --action STOP"
}

# --- Main ---
main() {
    echo "========================================"
    echo "OCI VM.Standard.A1.Flex Provisioner"
    echo "========================================"
    echo ""
    echo "Configuration:"
    echo "  Compartment: $COMPARTMENT_ID"
    echo "  Availability Domain: $AVAILABILITY_DOMAIN"
    echo "  Subnet: $SUBNET_ID"
    echo "  Instance Name: $INSTANCE_NAME"
    echo "  Shape: $SHAPE ($CPU_OCPUS OCPUs, ${MEMORY_GB}GB RAM)"
    echo ""

    configure_oci
    get_image_id
    provision_instance
}

# Run
main "$@"
