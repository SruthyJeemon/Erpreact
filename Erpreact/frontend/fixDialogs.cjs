const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.jsx')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(path.join(__dirname, 'src', 'components'), function(err, results) {
    if (err) throw err;
    let modifiedFiles = 0;
    results.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;
        
        content = content.replace(/<(Dialog)[ \t\r\n]+([^>]*?)onClose=\{([^}]+)\}/gs, (match, componentName, beforeOnClose, onCloseValue) => {
            if (onCloseValue.includes('backdropClick')) {
                 return match;
            }
            
            let newOnClose = '';
            let val = onCloseValue.trim();
            if (val.startsWith('() =>')) {
                let inner = val.slice(5).trim();
                newOnClose = `(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { ${inner.startsWith('{') ? inner.slice(1, -1) : inner} } }`;
            } else if (val.startsWith('e =>')) {
                let inner = val.slice(4).trim();
                newOnClose = `(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { ${inner.startsWith('{') ? inner.slice(1, -1) : inner} } }`;
            } else if (val.startsWith('(e) =>')) {
                let inner = val.slice(6).trim();
                newOnClose = `(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { ${inner.startsWith('{') ? inner.slice(1, -1) : inner} } }`;
            } else {
                newOnClose = `(event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { ${val}(event, reason); } }`;
            }
            return `<${componentName} ${beforeOnClose}onClose={${newOnClose}}`;
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            modifiedFiles++;
        }
    });
    console.log('Modified ' + modifiedFiles + ' files.');
});
