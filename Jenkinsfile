pipeline {
    agent any

    environment {
        // 镜像仓库配置
        REGISTRY = '110.42.247.238:5000'
        NAMESPACE = 'devtools-hub'
        FRONTEND_IMAGE = 'frontend'
        API_IMAGE = 'docker-api'

        // 服务器配置 (从 Jenkins Credentials 读取)
        SERVER = credentials('deploy-server')
        DEPLOY_USER = credentials('deploy-user')

        // 项目路径
        FRONTEND_DIR = 'devtools-hub'
        API_DIR = 'docker-api'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    parameters {
        choice(
            name: 'BUILD_TARGET',
            choices: ['all', 'frontend-only', 'api-only'],
            description: '选择构建目标'
        )
        choice(
            name: 'DEPLOY_STAGE',
            choices: ['build-and-deploy', 'build-only', 'deploy-only'],
            description: '选择部署阶段'
        )
        string(
            name: 'CUSTOM_TAG',
            defaultValue: '',
            description: '自定义镜像标签（留空则使用 git commit hash）'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = params.CUSTOM_TAG ?: env.GIT_COMMIT_SHORT
                    echo "镜像标签: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Pre-check') {
            steps {
                script {
                    sh '''
                        echo "===== 环境检查 ====="
                        docker --version
                        node --version || true
                        echo "==================="
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' }
            }
            parallel {
                stage('Frontend Deps') {
                    when {
                        expression { params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only' }
                    }
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm ci'
                        }
                    }
                }
                stage('API Deps') {
                    when {
                        expression { params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'api-only' }
                    }
                    steps {
                        dir(env.API_DIR) {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Code Quality') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' }
            }
            steps {
                script {
                    if (params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only') {
                        dir(env.FRONTEND_DIR) {
                            sh 'npm run lint || true'
                        }
                    }
                }
            }
        }

        stage('TypeScript Compile Check') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' }
            }
            steps {
                script {
                    if (params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only') {
                        dir(env.FRONTEND_DIR) {
                            sh 'npx tsc -b --noEmit'
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' && (params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only') }
            }
            steps {
                dir(env.FRONTEND_DIR) {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' }
            }
            parallel {
                stage('Frontend Image') {
                    when {
                        expression { params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only' }
                    }
                    steps {
                        script {
                            sh """
                                docker build -t \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$IMAGE_TAG -f \$FRONTEND_DIR/Dockerfile \$FRONTEND_DIR
                                docker tag \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$IMAGE_TAG \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:latest
                            """
                        }
                    }
                }
                stage('API Image') {
                    when {
                        expression { params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'api-only' }
                    }
                    steps {
                        script {
                            sh """
                                docker build -t \$REGISTRY/\$NAMESPACE/\$API_IMAGE:\$IMAGE_TAG -f \$API_DIR/Dockerfile \$API_DIR
                                docker tag \$REGISTRY/\$NAMESPACE/\$API_IMAGE:\$IMAGE_TAG \$REGISTRY/\$NAMESPACE/\$API_IMAGE:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Push to Registry') {
            when {
                expression { params.DEPLOY_STAGE != 'deploy-only' }
            }
            steps {
                script {
                    if (params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'frontend-only') {
                        sh """
                            docker push \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$IMAGE_TAG
                            docker push \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:latest
                        """
                    }
                    if (params.BUILD_TARGET == 'all' || params.BUILD_TARGET == 'api-only') {
                        sh """
                            docker push \$REGISTRY/\$NAMESPACE/\$API_IMAGE:\$IMAGE_TAG
                            docker push \$REGISTRY/\$NAMESPACE/\$API_IMAGE:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Server') {
            when {
                expression { params.DEPLOY_STAGE == 'build-and-deploy' }
            }
            steps {
                script {
                    sh '''
                        echo "===== 部署到生产服务器 ====="
                    '''
                    // 使用 SSH 部署（需要配置 SSH Credentials）
                    // 这里调用现有的 local-deploy.sh 逻辑
                    sh """
                        echo "部署阶段 - 调用部署脚本"
                        echo "服务器: \$SERVER"
                        echo "镜像: \$REGISTRY/\$NAMESPACE/\$FRONTEND_IMAGE:\$IMAGE_TAG"
                        # ./local-deploy.sh --skip-build \$IMAGE_TAG
                    """
                }
            }
        }
    }

    post {
        always {
            echo '===== 流水线结束 ====='
            cleanWs()
        }
        success {
            echo "✅ 构建成功！镜像标签: ${env.IMAGE_TAG}"
        }
        failure {
            echo '❌ 构建失败，请检查日志'
        }
    }
}
