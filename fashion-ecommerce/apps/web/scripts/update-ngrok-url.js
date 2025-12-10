/**
 * Script helper để tự động cập nhật VNPAY_RETURN_URL với ngrok URL
 * 
 * Cách sử dụng:
 * 1. Chạy ngrok: ngrok http 3000
 * 2. Chạy script này: node scripts/update-ngrok-url.js
 * 3. Script sẽ tự động lấy ngrok URL và cập nhật .env.local
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Lấy ngrok URL từ ngrok API
async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    // Ngrok API mặc định chạy HTTP trên 127.0.0.1:4040
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const httpsTunnel = json.tunnels?.find(t => t.proto === 'https');
          
          if (httpsTunnel && httpsTunnel.public_url) {
            resolve(httpsTunnel.public_url);
          } else {
            reject(new Error('Không tìm thấy HTTPS tunnel. Đảm bảo ngrok đang chạy với: ngrok http 3000'));
          }
        } catch (error) {
          reject(new Error('Không thể parse ngrok API response: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Không thể kết nối đến ngrok API. Đảm bảo ngrok đang chạy: ' + error.message));
    });
  });
}

// Cập nhật .env.local cho cả VNPay và SePay
function updateEnvFile(ngrokUrl) {
  const envPath = path.join(__dirname, '..', '.env');
  // VNPay callback (theo cấu trúc hiện tại trong env.example)
  const vnpayReturnUrl = `${ngrokUrl}/api/payments/vnpay/callback`;
  // SePay callback (theo cấu trúc hiện tại trong env.example)
  const sepayReturnUrl = `${ngrokUrl}/api/payments/sepay/callback`;
  
  let envContent = '';
  
  // Đọc file .env.local nếu tồn tại
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Nếu không tồn tại, đọc từ env.example
    const examplePath = path.join(__dirname, '..', 'env.example');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    }
  }

  // --- Cập nhật VNPAY_RETURN_URL ---
  if (envContent.includes('VNPAY_RETURN_URL=')) {
    envContent = envContent.replace(
      /VNPAY_RETURN_URL=.*/g,
      `VNPAY_RETURN_URL="${vnpayReturnUrl}"`
    );
  } else {
    // Thêm vào cuối file
    envContent += `\nVNPAY_RETURN_URL="${vnpayReturnUrl}"\n`;
  }

  // --- Cập nhật SEPAY_RETURN_URL ---
  if (envContent.includes('SEPAY_RETURN_URL=')) {
    envContent = envContent.replace(
      /SEPAY_RETURN_URL=.*/g,
      `SEPAY_RETURN_URL="${sepayReturnUrl}"`
    );
  } else {
    // Thêm vào cuối file
    envContent += `\nSEPAY_RETURN_URL="${sepayReturnUrl}"\n`;
  }
  
  // Ghi file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  return { vnpayReturnUrl, sepayReturnUrl };
}

// Main
async function main() {
  const isSoftMode = process.argv.includes('--soft'); // chế độ mềm: không kill process nếu lỗi
  try {
    console.log('🔍 Đang lấy ngrok URL...');
    const ngrokUrl = await getNgrokUrl();
    console.log('✅ Ngrok URL:', ngrokUrl);
    
    console.log('📝 Đang cập nhật .env.local...');
    const { vnpayReturnUrl, sepayReturnUrl } = updateEnvFile(ngrokUrl);
    console.log('✅ Đã cập nhật VNPAY_RETURN_URL :', vnpayReturnUrl);
    console.log('✅ Đã cập nhật SEPAY_RETURN_URL:', sepayReturnUrl);
    
    console.log('\n⚠️  LƯU Ý:');
    console.log('1. Cập nhật Return URL trong VNPay Sandbox (nếu cần):');
    console.log(`   Domain    : ${ngrokUrl.replace('https://', '')}`);
    console.log(`   Return URL: ${vnpayReturnUrl}`);
    console.log('2. Cập nhật Return URL trong dashboard SePay (nếu SePay yêu cầu cấu hình cố định).');
    console.log(`   Callback URL gợi ý: ${sepayReturnUrl}`);
    console.log('3. Restart server Next.js để áp dụng thay đổi');
    console.log('4. Đảm bảo ngrok vẫn đang chạy khi test payment');
    
  } catch (error) {
    console.error('❌ Lỗi cập nhật ngrok URL:', error.message);
    console.error('\n💡 Hướng dẫn nhanh:');
    console.error('1. Đảm bảo ngrok đang chạy: ngrok http 3000');
    console.error('2. Sau đó có thể chạy lại: npm run update-ngrok');

    // Nếu là soft mode (chạy kèm npm run dev) thì KHÔNG thoát với mã lỗi
    if (isSoftMode) {
      console.log('⚠️  Soft mode: Bỏ qua lỗi ngrok, tiếp tục chạy dev server...');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

main();

