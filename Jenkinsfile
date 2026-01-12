pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t expense-tracker .'
            }
        }

        stage('Run Container') {
            steps {
                bat '''
                docker stop expense-app
                docker rm expense-app
                docker run -d -p 8080:80 --name expense-app expense-tracker
                '''
            }
        }
    }
}
