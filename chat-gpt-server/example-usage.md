# דוגמת שימוש במערכת מעקב תשובות

## פונקציונליות חדשה שנוספה

### 1. מעקב אחר תשובות המשתמש
המערכת עכשיו מזהה אוטומטית כאשר המשתמש עונה על שאלות (א, ב, ג, ד) ושומרת את התשובות.

### 2. Endpoints חדשים

#### GET `/chat/stats/:userId`
מחזיר סטטיסטיקות של המשתמש:
```json
{
  "totalAnswered": 25,
  "correctAnswers": 20,
  "incorrectAnswers": 5,
  "accuracy": 80,
  "categoryStats": {
    "חוקי התנועה": {
      "total": 15,
      "correct": 12
    },
    "תמרורים": {
      "total": 10,
      "correct": 8
    }
  },
  "lastActivity": 1757241555590
}
```

#### GET `/chat/question-status/:userId/:questionId`
מחזיר סטטוס של שאלה ספציפית:
```json
{
  "status": "correct", // "correct", "incorrect", "not_answered"
  "answer": "ב",
  "isCorrect": true,
  "attempts": 1,
  "answeredAt": "2025-01-13T10:01:07.712Z"
}
```

### 3. תגובות חדשות בצ'אט

כאשר המשתמש עונה על שאלה, המערכת תחזיר:
```json
{
  "response": "✅ נכון! תשובה מצוינת!",
  "answerStatus": {
    "questionId": "0534",
    "userAnswer": "ב",
    "correctAnswer": "ב",
    "isCorrect": true
  }
}
```

או במקרה של תשובה שגויה:
```json
{
  "response": "❌ לא נכון. התשובה הנכונה היא א. הסבר: [הסבר קצר]",
  "answerStatus": {
    "questionId": "0534",
    "userAnswer": "ג",
    "correctAnswer": "א",
    "isCorrect": false
  }
}
```

### 4. דוגמת שימוש

1. **משתמש מבקש תרגול:**
   ```
   POST /chat
   {
     "message": "תן לי 5 שאלות על תמרורים",
     "userId": "user_123"
   }
   ```

2. **המערכת מחזירה שאלות**

3. **משתמש עונה:**
   ```
   POST /chat
   {
     "message": "א",
     "userId": "user_123"
   }
   ```

4. **המערכת מחזירה פידבק ושומרת את התשובה**

5. **בדיקת סטטיסטיקות:**
   ```
   GET /chat/stats/user_123
   ```

### 5. תכונות נוספות

- **מעקב ניסיונות**: המערכת שומרת כמה פעמים המשתמש ניסה לענות על אותה שאלה
- **זמן תגובה**: מעקב אחר זמן התגובה של המשתמש
- **סטטיסטיקות לפי קטגוריה**: דיוק לפי נושא (תמרורים, חוקי תנועה וכו')
- **היסטוריית פעילות**: מעקב אחר הפעילות האחרונה של המשתמש

### 6. מבנה הנתונים

כל תשובה נשמרת ב-`userProgress.json` עם המבנה הבא:
```json
{
  "questionId": "0534",
  "answer": "ב",
  "isCorrect": true,
  "answeredAt": "2025-01-13T10:01:07.712Z",
  "responseTime": 37734,
  "attempts": 1,
  "userNote": "",
  "hintUsed": false
}
```
