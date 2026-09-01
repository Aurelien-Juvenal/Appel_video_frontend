pipeline {
    agent any

    environment {
        APP_NAME = 'nextjs-appel-video'
        PORT = '3000'
        PATH = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"
        // Forcer une version d'API Docker rétrocompatible
        DOCKER_API_VERSION = '1.43'
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
    }
}
