const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (!dirPath.includes('node_modules') && !dirPath.includes('.next') && !dirPath.includes('.git')) {
        walkDir(dirPath, callback);
      }
    } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove lang === 'uz' ? A : B
  content = content.replace(/lang === 'uz'\s*\?\s*`Begona: \$\{([^}]+)\}`\s*:\s*`Сторонняя: \$\{([^}]+)\}`/g, '`Сторонняя: ${$2}`');
  
  content = content.replace(/lang === 'uz'\s*\?\s*"[^"]+"\s*:\s*("[^"]+")/g, '$1');
  content = content.replace(/lang === 'uz'\s*\?\s*'[^']+'\s*:\s*('[^']+)/g, '$1');
  // Handle escaped quotes: 'Ma\'lumot yo\'q'
  content = content.replace(/lang === 'uz'\s*\?\s*'Ma\\'lumot yo\\'q'\s*:\s*'Нет данных'/g, "'Нет данных'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Noma\\'lum'\s*:\s*'Неизвестно'/g, "'Неизвестно'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Telefon yo\\'q'\s*:\s*'Нет телефона'/g, "'Нет телефона'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Muddati o\\'tgan konteynerlar'\s*:\s*'Просроченные контейнеры'/g, "'Просроченные контейнеры'");
  content = content.replace(/lang === 'uz'\s*\?\s*'To\\'langan \(Beznal\)'\s*:\s*'Оплачено \(Безнал\)'/g, "'Оплачено (Безнал)'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Barchasini ko\\'rish'\s*:\s*'Показать все'/g, "'Показать все'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Ommaviy ko\\'chirish'\s*:\s*'Массовое переназначение'/g, "'Массовое переназначение'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Bitta buyurtmani ko\\'chirish'\s*:\s*'Переназначить один заказ'/g, "'Переназначить один заказ'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Ma\\'lumotlarni ko\\'chirish va biriktirish'\s*:\s*'Перенос и переназначение данных'/g, "'Перенос и переназначение данных'");
  content = content.replace(/lang === 'uz'\s*\?\s*'Bitta operatordagi barcha buyurtmalar, moliya va ombor kirimlarini boshqa operatorga to\\'liq o\\'tkazish.'\s*:\s*'Перенос всех заказов, финансов и доходов склада одного оператора на другого.'/g, "'Перенос всех заказов, финансов и доходов склада одного оператора на другого.'");

  content = content.replace(/lang === 'uz'\s*\?\s*`O'zimizning moshinalar: \$\{([^}]+)\}`\s*:\s*`Свои машины: \$\{([^}]+)\}`/g, '`Свои машины: ${$2}`');

  content = content.replace(/locale:\s*lang === 'uz'\s*\?\s*uz\s*:\s*ru/g, "locale: ru");
  content = content.replace(/lang === 'uz'\s*\?\s*'Yo\\'lda'\s*:\s*'В пути'/g, "'В пути'");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir(path.join(__dirname, 'components'), processFile);
walkDir(path.join(__dirname, 'app'), processFile);
