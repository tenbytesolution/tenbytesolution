const fs = require('fs');
const path = require('path');

console.log('🔍 Checking routes and controller functions...\n');

// Baca file adminRoutes.js
const adminRoutesPath = path.join(__dirname, 'routes', 'adminRoutes.js');
const adminRoutesContent = fs.readFileSync(adminRoutesPath, 'utf8');

// Ekstrak semua controller function yang dipanggil
const controllerCalls = adminRoutesContent.match(/\.(get|post|put|delete|patch)\([^)]*,\s*([A-Za-z]+Controller\.[A-Za-z]+)/g);

if (!controllerCalls) {
  console.log('❌ Tidak ditemukan controller calls di adminRoutes.js');
  process.exit(1);
}

console.log('📋 Controller functions called in adminRoutes.js:');
const functionMap = {};

controllerCalls.forEach(call => {
  const match = call.match(/([A-Za-z]+Controller)\.([A-Za-z]+)/);
  if (match) {
    const [_, controller, func] = match;
    if (!functionMap[controller]) {
      functionMap[controller] = new Set();
    }
    functionMap[controller].add(func);
    
    console.log(`  ${controller}.${func}()`);
  }
});

console.log('\n🔍 Checking if functions exist in controller files...\n');

// Periksa setiap controller
Object.entries(functionMap).forEach(([controllerName, functions]) => {
  const controllerPath = path.join(__dirname, 'controllers', `${controllerName}.js`);
  
  if (!fs.existsSync(controllerPath)) {
    console.log(`❌ ${controllerName}.js NOT FOUND!`);
    return;
  }
  
  const content = fs.readFileSync(controllerPath, 'utf8');
  
  console.log(`📄 ${controllerName}.js:`);
  
  functions.forEach(func => {
    // Cari pattern: static async functionName(
    const functionPattern = new RegExp(`static\\s+async\\s+${func}\\s*\\(`);
    if (functionPattern.test(content)) {
      console.log(`  ✓ ${func}() found`);
    } else {
      console.log(`  ❌ ${func}() NOT FOUND!`);
    }
  });
  console.log('');
});

console.log('✅ Route check completed!');