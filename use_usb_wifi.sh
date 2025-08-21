#!/bin/bash

USB_IF="wlx00e036503ae8"
INTERNAL_IF="wlp0s20f3"

# Ngắt WiFi tích hợp
echo ">> Ngắt WiFi tích hợp ($INTERNAL_IF)..."
nmcli device disconnect $INTERNAL_IF

# Hiện danh sách WiFi để người dùng chọn
echo ">> Các mạng WiFi khả dụng:"
nmcli dev wifi list

# Hỏi người dùng SSID và password
read -p "Nhập tên WiFi (SSID): " SSID
read -s -p "Nhập mật khẩu WiFi: " PASSWORD
echo ""

# Kết nối bằng USB WiFi
echo ">> Đang kết nối $SSID qua USB WiFi ($USB_IF)..."
nmcli device wifi connect "$SSID" password "$PASSWORD" ifname $USB_IF

echo ">> Trạng thái:"
nmcli device status
