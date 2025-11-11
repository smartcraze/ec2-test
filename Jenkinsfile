pipeline {
    agent any

    stages {
        stage('Prepare') {
            steps {
                echo 'Preparing workspace...'
                checkout scm
            }
        }
        stage('Install') {
            steps {
                echo 'Installing dependencies with bun'
                sh 'bun install'
            }
        }
        stage('Build image') {
            steps {
                echo 'Building Docker image'
                sh 'docker build -t my-app:${BUILD_NUMBER} .'
            }
        }
        stage('Smoke test') {
            steps {
                echo 'Running smoke tests against container'
                sh '''
                cid=$(docker run -d -p 3000:3000 my-app:${BUILD_NUMBER})
                sleep 2
                docker exec $cid /bin/sh -c "until curl -sS http://localhost:3000/health; do sleep 1; done"
                docker stop $cid
                '''
            }
        }
        stage('Push (optional)') {
            steps {
                echo 'Add push to registry steps here (requires credentials)'
            }
        }
    }
}


