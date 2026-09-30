how to Deploy Application with GitHub Actions & Docker

IMPORTANT ตั้งรหัสผ่าน database ของตัวเอง ในไฟล์ .env , docker-compose.yml

IMPORTANT เปลี่ยน .env ตรง DB_HOST = localhost ให้กลายเป็น DB_HOST=db เเทน
เพราะ เพราะใน docker-compose ตัว web app กับ MySQL รันอยู่คนละ container — คำว่า db คือชื่อ service ที่ Docker สร้างเป็น hostname ให้อัตโนมัติภายใน network เดียวกัน 

--- สั้นๆคือ มองหา sql ภายในตัวเอง ไม่เจอ

IMPORTANT ตั้ง secret เป็นข้อมูลของตัวเอง

1.DOCKER_HUB_USERNAME
2.DOCKER_HUB_TOKEN
3.HOST
4.SSH_KEY
5.DB_PASSWORD



1. ตั้งค่า EC2 (Virtual Machine)

2.1 ติดตั้ง Docker
SSH เข้า EC2 แล้วรันคำสั่ง:
sudo apt update
sudo apt install -y docker.io
sudo apt install -y docker-compose
sudo usermod -aG docker $USER
newgrp docker

ตรวจสอบการติดตั้ง:
docker --version
docker-compose --version

2.2 ตั้งค่า Security Group บน AWS
เปิด Inbound rules ต่อไปนี้:
•	Port 22 (SSH) - สำหรับ GitHub Action SSH เข้า EC2
•	Port 3000 (Custom TCP) - สำหรับ main branch
•	Port 3001 (Custom TCP) - สำหรับ develop branch
•	Port 3306 (MySQL) - optional 

3. ตั้งค่า GitHub Secrets
ไปที่ GitHub Repository → Settings → Secrets and variables → Actions แล้วเพิ่ม secrets ดังนี้:

•	DOCKER_HUB_USERNAME - ชื่อ user บน Docker Hub
•	DOCKER_HUB_TOKEN - Access Token จาก Docker Hub (Account Settings → Security → New Access Token)
•	HOST - Public IP Address ของ EC2
•	SSH_USER_NAME - username ของ EC2 (เช่น ubuntu)
•	SSH_KEY - Private Key (.pem file) ให้เปิดไฟล์แล้ว copy ทั้งหมดรวมถึง -----BEGIN และ -----END
•	SSH_PORT - ใส่เลข 22 


3.1 GitHub Actions Workflow (.github/workflows/deploy.yml)
Workflow จะ trigger เมื่อมีการ push ไปที่ main หรือ develop branch โดยอัตโนมัติ

4. วิธี Deploy
4.1 Deploy ครั้งแรก
1.	setup EC2 ให้เรียบร้อย
2.	ตั้งค่า GitHub Secrets
3.	Push code ขึ้น GitHub: 
4.	ดู progress ได้ที่ GitHub → Actions tab
5.	เมื่อ Action ผ่าน เปิดเว็บได้ที่ http://<EC2_IP>:3000

5.2 Deploy ครั้งถัดไป
เพียงแค่ push code ขึ้น GitHub และ GitHub Action จะ deploy ให้อัตโนมัติ

5.3 เข้าถึงเว็บ
•	main branch: http://<EC2_IP>:3000
•	develop branch: http://<EC2_IP>:3001

SUCCESS
 
6. Troubleshooting (หากเจอปัญหา)
ตรวจสอบ container บน EC2 พิมพ์ คำสั่งพวกนี้ใน terminal
docker ps
docker logs project_main_web_1

จากนั้น
6.2 Restart container
cd ~/app_main
docker-compose -p project_main down
docker-compose -p project_main up -d

6.3 ปัญหาที่พบบ่อย
•	Docker Hub unauthorized → ตรวจสอบ DOCKER_HUB_TOKEN ใน GitHub Secrets
•	Database connection failed → ตรวจสอบ DB_HOST=db ใน .env และ password ตรงกับ docker-compose.yml
•	ERR_CONNECTION_REFUSED → ตรวจสอบว่า container รันอยู่ด้วย docker ps และ Security Group เปิด port แล้ว