#!/bin/bash

# Update the instance
sudo yum update -y || sudo apt-get update -y

# Install Git
sudo yum install -y git || sudo apt-get install -y git

# Install Node.js and npm for Amazon Linux 2
sudo yum install -y nodejs npm || {
    # For Ubuntu-based instances
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
}

# Install pm2 globally using npm
sudo npm install pm2 -g

# Go to the home directory of the current user
cd /home/ec2-user

# Clone the repository
git clone -b main https://github.com/Kanyawatchalermthai/Cs369_Project_Sweeties.git

# Navigate to the project directory and install dependencies
cd Cs369_Project_Sweeties
sudo npm install
# sudo npm run build

# Start the application using pm2
 sudo pm2 start server.js

# Save the current pm2 processes
sudo pm2 save

# Ensure pm2 starts on boot
sudo pm2 startup


sudo yum install -y nginx

sudo systemctl start nginx
sudo systemctl enable nginx
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user
sudo setsebool -P httpd_read_user_content 1

# Restart Nginx to reflect the changes
sudo systemctl restart nginx
