pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/smartcraze/ec2-test.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'bun install'
            }
        }
        
    }

    post {
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}
