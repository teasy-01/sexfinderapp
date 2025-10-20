# 🚀 DigitalOcean Droplet Deployment Guide

Deploy your SexFinder app on a DigitalOcean Droplet with Nginx for a static site.

---

## 📊 Droplet vs App Platform

| Feature | Droplet | App Platform |
|---------|---------|--------------|
| **Cost** | $4-6/mo (better value) | $5-12/mo |
| **Setup Time** | 15-20 minutes | 5 minutes |
| **Complexity** | Medium | Easy |
| **Control** | Full | Limited |
| **Auto-scaling** | Manual | Automatic |
| **SSL** | Free (Let's Encrypt) | Free (Let's Encrypt) |
| **Best For** | Cost-conscious, static sites | Zero-config, auto-scaling |

**Recommendation**: Use Droplet if you want lower cost and don't need auto-scaling.

---

## 🎯 Deployment Steps

### Step 1: Create a Droplet

1. **Log in** to [DigitalOcean Console](https://cloud.digitalocean.com)
2. **Click "Create"** → **Droplets**
3. **Choose Image**: Ubuntu 24.04 x64 (LTS)
4. **Choose Plan**: 
   - **Basic**: $4/month (Recommended)
   - CPU: 512MB
   - SSD: 10GB
5. **Region**: Choose closest to your users
6. **Authentication**:
   - Choose "SSH key" (recommended) or password
   - If SSH: Set up SSH key (see SSH Setup section)
7. **Hostname**: `sexfinderapp`
8. **Click "Create Droplet"**

Wait 1-2 minutes for the Droplet to be created.

---

### Step 2: Connect to Your Droplet

#### Option A: SSH (Recommended)

```bash
ssh root@YOUR_DROPLET_IP
```

Replace `YOUR_DROPLET_IP` with the IP shown in DigitalOcean console.

#### Option B: Console (If no SSH)

In DigitalOcean console, click on your Droplet → "Console" tab.

---

### Step 3: Update System

Once connected, run:

```bash
apt update
apt upgrade -y
```

This ensures all packages are up to date.

---

### Step 4: Install Nginx

```bash
apt install nginx -y
```

Start Nginx:

```bash
systemctl start nginx
systemctl enable nginx
```

Check if running:

```bash
systemctl status nginx
```

---

### Step 5: Download Your Project

Create a directory for your site:

```bash
mkdir -p /var/www/sexfinderapp
cd /var/www/sexfinderapp
```

Clone from GitHub:

```bash
git clone https://github.com/teasy-01/sexfinderapp.git .
```

Or if you prefer to upload files via SCP:

```bash
# On your local machine:
scp -r /path/to/sexfinderapp root@YOUR_DROPLET_IP:/var/www/sexfinderapp/
```

---

### Step 6: Configure Nginx

Create an Nginx config file:

```bash
nano /etc/nginx/sites-available/sexfinderapp
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name sexfinderapp.com www.sexfinderapp.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/sexfinderapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sexfinderapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    server_name sexfinderapp.com www.sexfinderapp.com;
    
    # Redirect www to non-www
    if ($server_name = www.sexfinderapp.com) {
        return 301 https://sexfinderapp.com$request_uri;
    }
    
    # Rewrite rules for clean URLs (must be before location blocks)
    rewrite ^/index\.html$ / permanent;
    rewrite ^/index$ / permanent;
    rewrite ^([^.]*[^/])$ $1/ permanent;
    rewrite ^/(.+)\.html$ /$1 permanent;
    
    root /var/www/sexfinderapp;
    index index.html;
    
    # SSL Configuration (add your certificate paths)
    # ssl_certificate /etc/letsencrypt/live/sexfinderapp.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/sexfinderapp.com/privkey.pem;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://code.jquery.com https://cdnjs.cloudflare.com https://maxcdn.bootstrapcdn.com https://cdn.jsdelivr.net https://use.fontawesome.com 'unsafe-inline'; style-src 'self' https://cdn.tailwindcss.com https://stackpath.bootstrapcdn.com https://use.fontawesome.com 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://use.fontawesome.com; connect-src 'self' https://api.ipify.org https://ipapi.co https://central.captainemails.com https://checkip.amazonaws.com https://www.instabang.com;" always;
    
    # Cache headers for static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Redirect .html files to clean URLs
    location ~ \.html$ {
        rewrite ^/(.+)\.html$ /$1 permanent;
        rewrite ^/index\.html$ / permanent;
    }
    
    # Remove .html extension from URLs
    location / {
        try_files $uri $uri/ $uri.html =404;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
    
    location ~ \.env {
        deny all;
    }
}
```

**Important**: Replace `sexfinderapp.com` with your actual domain if different!

---

### Step 7: Enable the Site

```bash
ln -s /etc/nginx/sites-available/sexfinderapp /etc/nginx/sites-enabled/
```

Test Nginx config:

```bash
nginx -t
```

You should see: `syntax is ok` and `test is successful`

Restart Nginx:

```bash
systemctl restart nginx
```

---

### Step 8: Set Up HTTPS with Let's Encrypt

Install Certbot:

```bash
apt install certbot python3-certbot-nginx -y
```

Get SSL certificate:

```bash
certbot certonly --nginx -d sexfinderapp.com -d www.sexfinderapp.com
```

Follow the prompts (enter email address, accept terms, etc.)

Update Nginx config with HTTPS:

```bash
nano /etc/nginx/sites-available/sexfinderapp
```

Replace the first 4 lines with:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/sexfinderapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sexfinderapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    server_name sexfinderapp.com www.sexfinderapp.com;
    
    # ... rest of config stays same ...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name sexfinderapp.com www.sexfinderapp.com;
    return 301 https://$server_name$request_uri;
}
```

Test and restart:

```bash
nginx -t
systemctl restart nginx
```

---

### Step 9: Update DNS

Point your domain to your Droplet:

1. **Get your Droplet IP**: Shown in DigitalOcean console
2. **Update DNS at your registrar**:
   - Create A record: `sexfinderapp.com` → `YOUR_DROPLET_IP`
   - Create A record: `www.sexfinderapp.com` → `YOUR_DROPLET_IP`
3. **Wait** for DNS propagation (up to 24 hours, usually faster)

---

### Step 10: Set Up Auto-Renewal for SSL

Create renewal script:

```bash
certbot renew --dry-run
```

Certbot automatically sets up renewal via cron.

To manually renew:

```bash
certbot renew
```

---

## ✅ Verification

### Test Your Site

1. **Visit** `https://sexfinderapp.com`
2. **Check HTTPS** - Green lock should appear
3. **Test pages** - Click around, verify all links work
4. **Check console** - Press F12, no errors?

### Check Server Status

```bash
# Check Nginx
systemctl status nginx

# Check certificates
certbot certificates

# Check file permissions
ls -la /var/www/sexfinderapp/

# Check logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔧 Common Commands

### Update Your Site

Pull latest from GitHub:

```bash
cd /var/www/sexfinderapp
git pull origin main
```

### Restart Nginx

```bash
systemctl restart nginx
```

### View Nginx Logs

```bash
# Last 20 lines
tail -20 /var/log/nginx/access.log

# Real-time logs
tail -f /var/log/nginx/error.log
```

### Check Disk Space

```bash
df -h
```

### Renew SSL Certificate

```bash
certbot renew --force-renewal
```

---

## 🆘 Troubleshooting

### Site Not Loading

```bash
# Check if Nginx is running
systemctl status nginx

# Test config
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# List certificates
certbot certificates

# Renew manually
certbot renew --force-renewal

# Check certificate expiration
echo | openssl s_client -servername sexfinderapp.com -connect sexfinderapp.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Permission Denied

```bash
# Fix file permissions
chmod -R 755 /var/www/sexfinderapp
chmod -R 644 /var/www/sexfinderapp/*
find /var/www/sexfinderapp -type d -exec chmod 755 {} \;
find /var/www/sexfinderapp -type f -exec chmod 644 {} \;
```

### DNS Not Working

```bash
# Test DNS resolution
nslookup sexfinderapp.com
dig sexfinderapp.com

# Check your registrar DNS settings
# Verify A records point to correct IP
```

### .htaccess Not Working (Apache-specific)

This is expected - Nginx doesn't use .htaccess. The config above handles all the important .htaccess rules. You can delete it if you want:

```bash
rm /var/www/sexfinderapp/.htaccess
```

---

## 🔒 Security Best Practices

### 1. Disable Root Login

```bash
nano /etc/ssh/sshd_config
```

Find and change:
```
PermitRootLogin no
```

Restart SSH:
```bash
systemctl restart ssh
```

### 2. Set Up Firewall

```bash
# Allow SSH, HTTP, HTTPS only
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Backup Your Data

```bash
# Manual backup
tar -czf backup.tar.gz /var/www/sexfinderapp/

# Or use DigitalOcean Backups (in console, enable)
```

---

## 📊 Monitoring

### CPU and Memory Usage

```bash
# Real-time monitoring
htop

# Or
top
```

### Disk Usage

```bash
du -sh /var/www/sexfinderapp/
```

### Nginx Stats

```bash
# Active connections
netstat -an | grep ESTABLISHED | wc -l

# Top IPs
tail -1000 /var/log/nginx/access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn | head -20
```

---

## 🚀 Optimization Tips

### 1. Enable Gzip (Already Done)
Reduces file size by 70-80%

### 2. Browser Caching (Already Done)
Static assets cached for 1 year

### 3. Security Headers (Already Done)
Protection against common attacks

### 4. CDN (Optional)
Add DigitalOcean Spaces + CDN for global distribution

---

## 💰 Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Droplet (512MB) | $4/mo | Sufficient for static site |
| Domain | $12/year | Register separately |
| SSL | FREE | Let's Encrypt |
| Backups | $1/mo | Optional |
| **Total** | **~$5/mo** | Very affordable |

---

## 📞 Support

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Nginx Docs**: https://nginx.org/en/docs/
- **Certbot Docs**: https://certbot.eff.org/
- **Linux Commands**: https://man.digitalocean.com/

---

## ✨ What's Included

Your Droplet setup includes:
- ✅ Nginx web server
- ✅ Gzip compression
- ✅ Security headers
- ✅ Browser caching
- ✅ HTTPS/SSL with Let's Encrypt
- ✅ Auto-renewal of certificates
- ✅ Static file optimization
- ✅ Clean URL rewriting (no .html)

---

## 🎯 Next Steps

1. **Create Droplet** (5 min)
2. **SSH into Droplet** (2 min)
3. **Run commands** (10 min)
4. **Update DNS** (varies)
5. **Visit your site** (LIVE!) 🎉

---

**Your site will be live with HTTPS, caching, and optimization included!**

*Last Updated: October 17, 2025*
