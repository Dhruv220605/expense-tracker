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
                sh 'docker build -t expense-tracker .'
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                docker stop expense-app || true
                docker rm expense-app || true
                docker run -d -p 8080:80 --name expense-app expense-tracker
                '''
            }
        }
    }
}
