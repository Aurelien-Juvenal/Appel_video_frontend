pipeline {
    agent any

    environment {
        APP_NAME = 'nextjs-appel-video'
        PORT = '3000'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                // Récupération du code depuis GitHub
                checkout scm
            }
        }

        stage('2. Build Image Docker') {
            steps {
                script {
                    // Build de l'image Docker de l'application
                    sh "docker build -t ${APP_NAME}:latest ."
                }
            }
        }

        stage('3. Deploy Container') {
            steps {
                script {
                    // Arrêt et suppression de l'ancien conteneur s'il existe
                    sh "docker stop ${APP_NAME} || true"
                    sh "docker rm ${APP_NAME} || true"
                    
                    // Lancement du nouveau conteneur
                    sh "docker run -d --name ${APP_NAME} -p ${PORT}:3000 --restart always ${APP_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            // Nettoyage des images temporaires/inutilisées
            sh "docker image prune -f"
        }
        success {
            echo "Déploiement réussi ! L'application tourne sur le port 3000."
        }
        failure {
            echo "Échec du déploiement."
        }
    }
}
