# Project 1: Host a Static Website on AWS

* **Level:** 🟢 **Beginner**

## Tools Required

* ☁️ **AWS EC2**
* 🌐 **Nginx**
* 🐧 **Linux**
* 📂 **Git**

## Project Overview

* Deploy a simple **HTML, CSS, and JavaScript** website on an **AWS EC2** instance.
* Learn how to host a website on a cloud server.
* Understand the basics of:

  * Linux Administration
  * SSH Remote Access
  * Web Server Configuration
  * Cloud Deployment
  * Networking

## What You'll Learn

* Launch an **AWS EC2** instance.
* Connect to the server using **SSH**.
* Install and configure **Nginx**.
* Configure **AWS Security Groups**.
* Upload website files to the server.
* Configure **DNS** *(Optional)*.

## Skills You'll Gain

* AWS Cloud Fundamentals
* Linux Server Management
* SSH Authentication
* Web Server Deployment
* Cloud Networking Basics
* Website Hosting

## Resume Value

* Demonstrates practical **AWS Cloud Deployment** skills.
* Shows experience with **Linux server administration**.
* Proves your understanding of basic cloud infrastructure.
* Makes an excellent beginner DevOps portfolio project.


Sure. Here is the **short and practical version** of the project steps, keeping only the important actions.

# 🚀 Project 1: Host a Static Website on AWS EC2

## Step-by-Step Short Version

### 1. AWS Setup

1. Login to [AWS Console](https://aws.amazon.com/console/?utm_source=chatgpt.com)
2. Select AWS Region.
3. Open **EC2**.
4. Click **Launch Instance**.

### 2. Create EC2

5. Name: `static-website-server`
6. Select **Ubuntu Server**.
7. Select a small **Free Tier-eligible instance**, if available.
8. Create/download an **SSH Key Pair** (`.pem`).
9. Create/select a **Security Group**.

### 3. Security Group

Allow:

| Protocol | Port | Source   | Purpose        |
| -------- | ---: | -------- | -------------- |
| SSH      |   22 | My IP    | Server access  |
| HTTP     |   80 | Anywhere | Website access |

10. Launch the EC2 instance.

### 4. Connect to EC2

11. Copy the **Public IPv4 Address**.
12. Open PowerShell/Windows Terminal.
13. Connect using SSH:

```bash
ssh -i "your-key.pem" ubuntu@YOUR_PUBLIC_IP
```

### 5. Update Linux

14. Update Ubuntu:

```bash
sudo apt update
sudo apt upgrade -y
```

### 6. Install Nginx

15. Install Nginx:

```bash
sudo apt install nginx -y
```

16. Check Nginx:

```bash
sudo systemctl status nginx
```

### 7. Test Nginx

17. Open browser.
18. Enter:

```text
http://YOUR_PUBLIC_IP
```

19. Confirm the Nginx welcome page appears.

### 8. Deploy Website

20. Go to the Nginx website directory:

```bash
cd /var/www/html
```

21. Create/upload:

```text
index.html
style.css
script.js
```

22. Test your website again:

```text
http://YOUR_PUBLIC_IP
```

### 9. Install Git

23. Install Git:

```bash
sudo apt install git -y
```

24. Verify:

```bash
git --version
```

25. Optional: Clone your GitHub website repository onto EC2.

### 10. Optional: Domain & HTTPS

26. Connect a domain using DNS/Route 53.
27. Configure Nginx for the domain.
28. Add HTTPS/SSL.

---

# 🎯 Final Project Flow

```text
AWS
 ↓
EC2
 ↓
Ubuntu Linux
 ↓
SSH
 ↓
Nginx
 ↓
HTML + CSS + JavaScript
 ↓
Security Group
 ↓
Internet
 ↓
🌐 Website
```

## ✅ Final Checklist

* [ ] Create EC2
* [ ] Create SSH key
* [ ] Configure Security Group
* [ ] Connect using SSH
* [ ] Learn basic Linux commands
* [ ] Install Nginx
* [ ] Test Nginx
* [ ] Upload website
* [ ] Access website using Public IP
* [ ] Install Git
* [ ] Connect GitHub
* [ ] Optional: Domain
* [ ] Optional: HTTPS

**For your first attempt, focus only on steps 1–22.** Once your website opens successfully using the EC2 public IP, move to Git, DNS, and HTTPS.
