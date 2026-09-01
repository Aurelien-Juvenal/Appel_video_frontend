pipeline {
    agent any

    environment {
        APP_NAME = 'nextjs-appel-video'
        PORT = '3000'
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
                    // Utilisation de bat à la place de sh pour Windows
                    bat "docker build -t ${APP_NAME}:latest ."
                }
            }
        }

        stage('3. Deploy Container') {
            steps {
                script {
                    // Arrêt et relance du conteneur en batch Windows
                    bat "docker stop ${APP_NAME} || exit 0"
                    bat "docker rm ${APP_NAME} || exit 0"
                    bat "docker run -d --name ${APP_NAME} -p ${PORT}:3000 --restart always ${APP_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            // Nettoyage des images Docker obsolètes
            bat "docker image prune -f"
        }
        success {
            echo "Déploiement réussi !"
        }
        failure {
            echo "Échec du déploiement."
        }
    }
}
