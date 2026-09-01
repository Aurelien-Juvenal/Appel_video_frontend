pipeline {
    agent any

    environment {
        APP_NAME = 'nextjs-appel-video'
        PORT = '3000'
        // Ajout du dossier binaire de Docker Desktop au PATH du pipeline
        PATH = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Build Image Docker') {
            steps {
                script {
                    bat "docker build -t ${APP_NAME}:latest ."
                }
            }
        }

        stage('3. Deploy Container') {
            steps {
                script {
                    bat "docker stop ${APP_NAME} || exit 0"
                    bat "docker rm ${APP_NAME} || exit 0"
                    bat "docker run -d --name ${APP_NAME} -p ${PORT}:3000 --restart always ${APP_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            bat "docker image prune -f || exit 0"
        }
        success {
            echo "Déploiement réussi !"
        }
        failure {
            echo "Échec du déploiement."
        }
    }
}
