#!/bin/bash
# =============================================
#  Tekton Pipeline Setup Script
#  一键安装 DevTools Hub 的 Tekton CI/CD
# =============================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
step()  { echo -e "${YELLOW}[STEP]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ==================== Step 1: Prerequisites ====================
step "1/8 检查 kubectl..."
if ! command -v kubectl &> /dev/null; then
    err "kubectl not found. Please install kubectl first."
    exit 1
fi
info "kubectl OK"

step "2/8 检查 Tekton Pipelines..."
if ! kubectl get pods -n tekton-pipelines &> /dev/null; then
    err "Tekton Pipelines not installed."
    echo "Install with:"
    echo "  kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml"
    exit 1
fi
info "Tekton Pipelines OK"

# ==================== Step 2: Namespace ====================
step "3/8 创建 namespace..."
kubectl create namespace devtools-hub --dry-run=client -o yaml | kubectl apply -f -

# ==================== Step 3: Secrets ====================
step "4/8 创建 SSH 密钥 Secret..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$HOME/.ssh/devtools_key" ]; then
    kubectl delete secret deploy-ssh-keys -n devtools-hub --ignore-not-found
    kubectl create secret generic deploy-ssh-keys -n devtools-hub \
        --from-file=id_rsa="$HOME/.ssh/devtools_key" \
        --from-literal=known_hosts="$(ssh-keyscan -H 110.42.247.238 2>/dev/null || echo '')"
    info "SSH secret created"
else
    warn "SSH key not found at ~/.ssh/devtools_key"
    echo "  Create with:"
    echo "  kubectl create secret generic deploy-ssh-keys -n devtools-hub \\"
    echo "    --from-file=id_rsa=/path/to/ssh/key \\"
    echo "    --from-literal=known_hosts=\"\$(ssh-keyscan -H 110.42.247.238)\""
fi

step "5/8 创建 Docker Registry Secret..."
kubectl delete secret docker-registry-auth -n devtools-hub --ignore-not-found
kubectl create secret docker-registry docker-registry-auth -n devtools-hub \
    --docker-server=localhost:5001 \
    --docker-username=admin \
    --docker-password=admin123 \
    --dry-run=client -o yaml | kubectl apply -f -
info "Docker registry secret created (update credentials if needed)"

# ==================== Step 4: Apply Tasks ====================
step "6/8 安装 Tekton Tasks..."
for task in "$SCRIPT_DIR/tasks"/*.yaml; do
    echo "  Applying $(basename $task)..."
    kubectl apply -f "$task" -n devtools-hub
done
info "Tasks installed"

# ==================== Step 5: Apply Pipeline ====================
step "7/8 安装 Pipeline..."
kubectl apply -f "$SCRIPT_DIR/pipeline/devtools-cicd.yaml" -n devtools-hub
info "Pipeline installed"

# ==================== Step 6: Apply Triggers ====================
step "8/8 安装 Webhook Triggers (可选)..."
if kubectl get pods -n tekton-pipelines -l app=tekton-triggers-controller &> /dev/null; then
    kubectl apply -f "$SCRIPT_DIR/triggers/github-webhook.yaml" -n devtools-hub
    EVENT_URL=$(kubectl get eventlistener devtools-github-listener -n devtools-hub \
        -o jsonpath='{.status.address.url}' 2>/dev/null || echo "N/A")
    info "Triggers installed. Webhook URL: $EVENT_URL"
else
    warn "Tekton Triggers not installed. Skipping webhook setup."
    echo "  Install with: kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml"
fi

# ==================== Done ====================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  ✅ Tekton CI/CD Setup Complete${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "  ${GREEN}Pipeline:${NC}     devtools-cicd"
echo -e "  ${GREEN}Namespace:${NC}    devtools-hub"
echo ""
echo "  Run the pipeline:"
echo -e "    ${YELLOW}kubectl create -f tekton/pipelinerun/pipelinerun.yaml -n devtools-hub${NC}"
echo ""
echo "  Or trigger via CLI:"
echo -e "    ${YELLOW}tkn pipeline start devtools-cicd \\${NC}"
echo -e "    ${YELLOW}  -p repo-url=https://github.com/your-org/devtools-hub.git \\${NC}"
echo -e "    ${YELLOW}  -p repo-revision=main \\${NC}"
echo -e "    ${YELLOW}  -p build-target=all \\${NC}"
echo -e "    ${YELLOW}  -p deploy-target=all \\${NC}"
echo -e "    ${YELLOW}  -w name=shared-source,claimName=devtools-source-pvc \\${NC}"
echo -e "    ${YELLOW}  -w name=ssh-keys,secret=deploy-ssh-keys \\${NC}"
echo -e "    ${YELLOW}  -w name=docker-config,secret=docker-registry-auth${NC}"
