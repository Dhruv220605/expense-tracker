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
                withSonarQubeEnv('SonarQube') {
                    bat '''
                    sonar-scanner ^
                    -Dsonar.projectKey=expense-tracker ^
                    -Dsonar.sources=.
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
                docker run -d -p 8091:80 --name expense-app expense-tracker
                '''
            }
        }
    }
}
