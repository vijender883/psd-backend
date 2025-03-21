pipeline {
    agent any
    
    triggers {
        githubPush()
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Pull Latest Code') {
            steps {
                echo "Starting: Pulling latest code on application server"
                sh 'ssh -o StrictHostKeyChecking=no ubuntu@65.2.46.28 "cd /home/ubuntu/practicalsystemdesign && git pull origin main && echo SUCCESS: Code successfully pulled from GitHub"'
            }
            post {
                failure {
                    echo "FAILURE: Pull Latest Code stage failed"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo "Starting: Installing dependencies on application server"
                sh 'ssh -o StrictHostKeyChecking=no ubuntu@65.2.46.28 "cd /home/ubuntu/practicalsystemdesign && npm install --omit=dev --silent && echo SUCCESS: Dependencies installed successfully"'
            }
            post {
                failure {
                    echo "FAILURE: Install Dependencies stage failed"
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                echo "Starting: Running tests on application server"
                sh 'ssh -o StrictHostKeyChecking=no ubuntu@65.2.46.28 "cd /home/ubuntu/practicalsystemdesign && npm test && echo SUCCESS: All tests passed"'
            }
            post {
                failure {
                    echo "FAILURE: Run Tests stage failed"
                }
            }
        }
        
        stage('Deploy Application') {
            steps {
                echo "Starting: Restarting Node.js application with PM2"
                sh '''
                ssh -o StrictHostKeyChecking=no ubuntu@65.2.46.28 "
                cd /home/ubuntu/practicalsystemdesign &&
                pm2 stop server || true &&
                pm2 start server.js --name server &&
                pm2 save &&
                pm2 status &&
                echo SUCCESS: Application started successfully"
                '''
            }
            post {
                failure {
                    echo "FAILURE: Deploy Application stage failed"
                }
            }
        }
    }
    
    post {
        success {
            echo "SUCCESS: Complete pipeline executed successfully"
        }
        failure {
            echo "FAILURE: Pipeline failed - check the logs for details"
        }
    }
}
