# មគ្គុទ្ទេសក៍ការ Hosting គម្រោងជាមួយ Render.com & Upstash Cloud (ឥតគិតថ្លៃ ១០០%)

ឯកសារនេះណែនាំបងពីរបៀបបង្ហោះ (Host) គម្រោង `businessdata168` ទៅកាន់សេវាកម្ម **Render.com** រួមគ្នាជាមួយ **Upstash Redis** (សម្រាប់រក្សាទុកទិន្នន័យ) ដោយឥតគិតថ្លៃ ១០០% និងដំណើរការរត់ដោយស្វ័យប្រវត្តិតាមរយៈ GitHub (Continuous Deployment)។

---

## 💡 របៀបដែលវាដំណើរការដើម្បីរក្សាទុកទិន្នន័យ (Database) ឥតគិតថ្លៃ
ដោយសារម៉ាស៊ីន Render ឥតគិតថ្លៃវានឹងលុបឯកសារចោលរាល់ពេលដែលវា Restart ឬពេលបងរុញកូដថ្មី ខ្ញុំបានកែសម្រួលកូដគម្រោងដើម្បីឱ្យវារក្សាទុកទិន្នន័យនៅលើ Cloud របស់ **Upstash Redis** ដោយស្វ័យប្រវត្តិតាមរបៀប៖
1. ពេល Server ចាប់ផ្តើម វានឹងទាញយកទិន្នន័យ `database.json` ចុងក្រោយពី Upstash មកដាក់ក្នុងម៉ាស៊ីន Render។
2. រាល់ពេលបងបន្ថែមលក់ ឬផលិតផល វានឹងរក្សាទុកទៅកាន់ Upstash Cloud វិញភ្លាមៗ។
3. វិធីនេះជួយឱ្យទិន្នន័យគម្រោងរបស់បងនៅគង់វង្ស ១០០% ដោយមិនបាច់បង់ប្រាក់ប្រចាំខែឡើយ។

---

## ជំហានទី ១៖ បង្កើតគណនី និងទទួលបាន URL/Token ពី Upstash Redis (ឥតគិតថ្លៃ)
1. ចូលទៅកាន់គេហទំព័រ [upstash.com](https://upstash.com)។
2. ចុច **Log In** ជាមួយគណនី **GitHub** របស់អ្នក។
3. ចុចប៊ូតុង **Create Database**។
4. បំពេញព័ត៌មាន៖
   - **Name**: `businessdata-db` (ឬឈ្មោះអ្វីផ្សេង)
   - **Type**: ជ្រើសរើស **Redis**
   - **Region**: ជ្រើសរើសយក **Singapore** (ឬប្រទេសជិតៗកម្ពុជា)
   - ចុចប៊ូតុង **Create**។
5. បន្ទាប់ពីបង្កើតរួច សូមអូសចុះមកក្រោម រកមើលផ្នែក **REST API**។
6. ចម្លង (Copy) តម្លៃពីរខាងក្រោមនេះ ដើម្បីយកទៅដាក់ក្នុង Render៖
   - **`UPSTASH_REDIS_REST_URL`**
   - **`UPSTASH_REDIS_REST_TOKEN`**

---

## ជំហានទី ២៖ បង្កើត Web Service ថ្មីនៅលើ Render.com
1. ចូលទៅកាន់គេហទំព័រ [render.com](https://render.com) ឡុកអ៊ីនជាមួយ **GitHub**។
2. ចុចលើប៊ូតុង **New +** ជ្រើសរើសយក **Web Service**។
3. ជ្រើសរើស **Build and deploy from a Git repository** រួចចុច **Next**។
4. ស្វែងរកឈ្មោះ **`businessdata168`** រួចចុចប៊ូតុង **Connect**។

---

## ជំហានទី ៣៖ កំណត់ព័ត៌មានម៉ាស៊ីន (Settings)
បំពេញព័ត៌មានដូចខាងក្រោម៖
- **Name**: `businessdata168`
- **Region**: ជ្រើសរើសយក **Singapore**
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: ជ្រើសរើស **Free**

---

## ជំហានទី ៤៖ កំណត់ Environment Variables (សំខាន់បំផុត)
1. អូសចុះមកក្រោមបន្តិច រកមើលផ្នែក **Environment Variables** (ឬចុចលើផ្នែក **Advanced**)។
2. ចុចលើ **Add Environment Variable** រួចបំពេញព័ត៌មានទាំង ៥ នេះ៖
   - **Key**: `NODE_ENV` ➡️ **Value**: `production`
   - **Key**: `JWT_SECRET` ➡️ **Value**: `9d6c5b6277e8cb96f6cf9b7d0dbfb0aabe6ecb720742d90ac71fcb1234ea8c93` (ឬលេខកូដសម្ងាត់ផ្ទាល់ខ្លួនរបស់អ្នក)
   - **Key**: `PORT` ➡️ **Value**: `10000`
   - **Key**: `UPSTASH_REDIS_REST_URL` ➡️ **Value**: `[ចម្លង URL ពី Upstash ដែលបានមកពីជំហានទី ១]`
   - **Key**: `UPSTASH_REDIS_REST_TOKEN` ➡️ **Value**: `[ចម្លង Token ពី Upstash ដែលបានមកពីជំហានទី ១]`
3. ចុចប៊ូតុង **Create Web Service** នៅខាងក្រោមបង្អស់។

---

## ជំហានទី ៥៖ ដំណើរការ និងប្រើប្រាស់
- Render នឹងចាប់ផ្តើមទាញយកកូដគម្រោងពី GitHub មកដំឡើង និងបង្កើត (Build) កូដ។ 
- នៅពេលដំឡើងចប់ជោគជ័យ វានឹងបង្ហាញពាក្យថា **`Your service is live`**។
- បងអាចចុចលើ Link របស់ Render ខាងលើឆ្វេង (ឧទាហរណ៍៖ `https://businessdata168.onrender.com`) ដើម្បីចូលប្រើប្រាស់កម្មវិធី។

---

## 🔄 ដំណើរការ CD (Continuous Deployment)
ចាប់ពីពេលនេះទៅ រាល់ពេលដែលលោកអ្នកធ្វើការកែប្រែកូដនៅក្នុងកុំព្យូទ័រ រួចវាយបញ្ជារុញ (Push) ទៅ GitHub៖
```bash
git add .
git commit -m "Update some features"
git push
```
ប្រព័ន្ធ **Render** នឹងដឹងភ្លាមៗ រួចទាញយកកូដថ្មីទៅដំឡើង និងដំណើរការឡើងវិញដោយស្វ័យប្រវត្តិក្នុងរយៈពេលត្រឹមតែប៉ុន្មានវិនាទីប៉ុណ្ណោះ!
