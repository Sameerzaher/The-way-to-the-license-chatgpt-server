const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// יצירת דוח PDF לבחינה
function generateExamReport(examData, userData, achievements = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // יצירת buffer לזיכרון
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // כותרת ראשית
      doc.fontSize(24)
         .fillColor('#2c3e50')
         .text('דוח בחינה - תיאוריה לרישיון נהיגה', 50, 50, { align: 'center' });

      // קו מפריד
      doc.moveTo(50, 90)
         .lineTo(550, 90)
         .stroke('#3498db', 2);

      // פרטי משתמש
      doc.fontSize(16)
         .fillColor('#34495e')
         .text('פרטי הנבחן:', 50, 110);

      doc.fontSize(12)
         .fillColor('#2c3e50')
         .text(`שם: ${userData.name || 'לא צוין'}`, 70, 140)
         .text(`תאריך הבחינה: ${formatDate(examData.endTime || examData.startTime)}`, 70, 160)
         .text(`סוג הבחינה: ${formatExamType(examData.examType)}`, 70, 180)
         .text(`זמן הבחינה: ${formatDuration(examData.timeSpent)}`, 70, 200);

      // ציון
      const scoreY = 240;
      doc.fontSize(18)
         .fillColor(examData.passed ? '#27ae60' : '#e74c3c')
         .text('תוצאות הבחינה:', 50, scoreY);

      doc.fontSize(48)
         .fillColor(examData.passed ? '#27ae60' : '#e74c3c')
         .text(`${examData.score}/${examData.questionCount}`, 50, scoreY + 30, { align: 'center' });

      doc.fontSize(16)
         .fillColor(examData.passed ? '#27ae60' : '#e74c3c')
         .text(examData.passed ? 'עבר בהצלחה! 🎉' : 'לא עבר הפעם', 50, scoreY + 90, { align: 'center' });

      doc.fontSize(14)
         .fillColor('#7f8c8d')
         .text(`דיוק: ${examData.accuracy || 0}%`, 50, scoreY + 120, { align: 'center' });

      // סטטיסטיקות מפורטות
      const statsY = scoreY + 160;
      doc.fontSize(16)
         .fillColor('#34495e')
         .text('סטטיסטיקות מפורטות:', 50, statsY);

      const correctCount = examData.questions ? examData.questions.filter(q => q.isCorrect).length : 0;
      const wrongCount = examData.questions ? examData.questions.filter(q => q.wasAnswered && !q.isCorrect).length : 0;
      const unansweredCount = examData.questions ? examData.questions.filter(q => !q.wasAnswered).length : 0;

      doc.fontSize(12)
         .fillColor('#2c3e50')
         .text(`תשובות נכונות: ${correctCount}`, 70, statsY + 30)
         .text(`תשובות שגויות: ${wrongCount}`, 70, statsY + 50)
         .text(`לא נענו: ${unansweredCount}`, 70, statsY + 70);

      // ניתוח לפי נושאים
      if (examData.categoryBreakdown) {
        const categoryY = statsY + 100;
        doc.fontSize(16)
           .fillColor('#34495e')
           .text('ניתוח לפי נושאים:', 50, categoryY);

        let currentY = categoryY + 30;
        Object.entries(examData.categoryBreakdown).forEach(([category, stats]) => {
          const percentage = Math.round((stats.correct / stats.total) * 100);
          
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text(`${category}: ${stats.correct}/${stats.total} (${percentage}%)`, 70, currentY);
          
          currentY += 20;
          
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        });
      }

      // הישגים חדשים
      if (achievements && achievements.length > 0) {
        const achievementY = currentY + 30;
        doc.fontSize(16)
           .fillColor('#f39c12')
           .text('הישגים חדשים! 🏆', 50, achievementY);

        achievements.forEach((achievement, index) => {
          const achievementTextY = achievementY + 30 + (index * 25);
          
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text(`• ${achievement.name}`, 70, achievementTextY)
             .fontSize(10)
             .fillColor('#7f8c8d')
             .text(`  ${achievement.description}`, 90, achievementTextY + 15);
          
          if (achievementTextY > 700) {
            doc.addPage();
          }
        });
      }

      // המלצות
      const recommendationsY = currentY + 100;
      doc.fontSize(16)
         .fillColor('#34495e')
         .text('המלצות:', 50, recommendationsY);

      const recommendations = getRecommendations(examData);
      recommendations.forEach((rec, index) => {
        const recY = recommendationsY + 30 + (index * 20);
        
        doc.fontSize(11)
           .fillColor('#2c3e50')
           .text(`• ${rec}`, 70, recY);
        
        if (recY > 700) {
          doc.addPage();
        }
      });

      // כותרת תחתונה
      doc.fontSize(10)
         .fillColor('#95a5a6')
         .text('דוח זה נוצר אוטומטית על ידי מערכת הבחינות', 50, 750, { align: 'center' })
         .text(`תאריך יצירה: ${formatDate(new Date())}`, 50, 770, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// יצירת תעודת הצלחה
function generateCertificate(examData, userData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // רקע צבעוני
      doc.rect(0, 0, 595, 842)
         .fill('#f8f9fa');

      // מסגרת זהב
      doc.rect(40, 40, 515, 762)
         .stroke('#f39c12', 5);

      doc.rect(50, 50, 495, 742)
         .stroke('#e67e22', 2);

      // כותרת
      doc.fontSize(28)
         .fillColor('#2c3e50')
         .text('תעודת הצלחה', 50, 150, { align: 'center' });

      // תת-כותרת
      doc.fontSize(18)
         .fillColor('#7f8c8d')
         .text('בחינת תיאוריה לרישיון נהיגה', 50, 190, { align: 'center' });

      // שם הנבחן
      doc.fontSize(24)
         .fillColor('#2c3e50')
         .text(userData.name || 'הנבחן', 50, 280, { align: 'center' });

      doc.fontSize(16)
         .fillColor('#7f8c8d')
         .text('הצליח בבחינה התיאורטית', 50, 320, { align: 'center' });

      // ציון
      doc.fontSize(48)
         .fillColor('#27ae60')
         .text(`${examData.score}/${examData.questionCount}`, 50, 380, { align: 'center' });

      doc.fontSize(18)
         .fillColor('#27ae60')
         .text('ציון מעולה!', 50, 440, { align: 'center' });

      // פרטים נוספים
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text(`תאריך הבחינה: ${formatDate(examData.endTime)}`, 50, 500, { align: 'center' })
         .text(`זמן הבחינה: ${formatDuration(examData.timeSpent)}`, 50, 525, { align: 'center' })
         .text(`דיוק: ${examData.accuracy || 0}%`, 50, 550, { align: 'center' });

      // חתימה
      doc.fontSize(12)
         .fillColor('#7f8c8d')
         .text('המערכת חותמת בזאת על הצלחת הנבחן', 50, 650, { align: 'center' })
         .text(`תאריך: ${formatDate(new Date())}`, 50, 675, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// פונקציות עזר
function formatDate(date) {
  if (!date) return 'לא צוין';
  const d = new Date(date);
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatExamType(type) {
  const types = {
    'mock': 'בחינה מדומה',
    'practice': 'תרגול',
    'final': 'בחינה סופית'
  };
  return types[type] || type;
}

function formatDuration(ms) {
  if (!ms) return 'לא צוין';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getRecommendations(examData) {
  const recommendations = [];
  
  if (!examData.passed) {
    recommendations.push('מומלץ לתרגל יותר את הנושאים שבהם טעית');
    recommendations.push('קרא שוב את חומר הלימוד המודפס');
    recommendations.push('פתור בחינות נוספות לפני הניסיון הבא');
  } else {
    recommendations.push('כל הכבוד! המשך לשמור על הרמה הגבוהה');
    recommendations.push('מומלץ לתרגל מדי פעם כדי לא לשכוח');
  }
  
  if (examData.accuracy < 80) {
    recommendations.push('התמקד בהבנת החומר ולא בשינון בעל פה');
  }
  
  return recommendations;
}

// שמירת PDF לקובץ
async function savePDFToFile(pdfBuffer, filename) {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
  
  // יצירת תיקייה אם לא קיימת
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
}

module.exports = {
  generateExamReport,
  generateCertificate,
  savePDFToFile
};
