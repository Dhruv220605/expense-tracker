pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    bat '''
                    sonar-scanner ^
                    -Dsonar.projectKey=expense-tracker ^
                    -Dsonar.sources=. ^
                    -Dsonar.host.url=http://localhost:9000 ^
                    -Dsonar.token=%SONAR_TOKEN%
                    '''
                }
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
                docker stop expense-app || exit 0
                docker rm expense-app || exit 0
                docker run -d -p 8092:80 --name expense-app expense-tracker
                '''
            }
        }
    }
}
