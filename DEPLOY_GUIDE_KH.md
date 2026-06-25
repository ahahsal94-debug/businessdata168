# មគ្គុទ្ទេសក៍ការ Hosting គម្រោងជាមួយ Render.com (Continuous Deployment)

ឯកសារនេះណែនាំបងពីរបៀបបង្ហោះ (Host) គម្រោង `businessdata168` ទៅកាន់សេវាកម្ម **Render.com** ដោយភ្ជាប់ជាមួយ GitHub ដើម្បីឱ្យវារត់ និងធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិនៅពេលបងរុញកូដថ្មី (Push)។

---

## ⚠️ ព័ត៌មានសំខាន់អំពីការរក្សាទុកទិន្នន័យ (Database)
គម្រោងនេះប្រើប្រាស់ Database ជាហ្វាយ (`businessdata/database.json`)៖
- ប្រសិនបើបងប្រើសេវាកម្ម **Render ឥតគិតថ្លៃ (Free Tier)**៖ រាល់ពេលដែលប្រព័ន្ធរត់ឡើងវិញ ឬនៅពេលបង Push កូដថ្មី ឯកសារ `database.json` នឹងត្រូវកំណត់ឡើងវិញ (លុបទិន្នន័យចាស់ចោល)។
- **ដំណោះស្រាយ**៖ ដើម្បីកុំឱ្យបាត់បង់ទិន្នន័យ លោកអ្នកគួរប្រើប្រាស់សេវាកម្មបង់ថ្លៃ **Render Starter Plan** ($7/ខែ) ហើយភ្ជាប់ **Persistent Disk** (ទំហំ 1GB) ទៅកាន់ថត `businessdata` នោះទិន្នន័យនឹងរក្សាទុកជាអចិន្ត្រៃយ៍។

---

## ជំហានទី ១៖ បង្កើតគណនី និងភ្ជាប់ជាមួយ GitHub
1. ចូលទៅកាន់គេហទំព័រ [render.com](https://render.com)។
2. ចុចលើប៊ូតុង **Sign Up** ឬ **Log In** រួចជ្រើសរើសយក **GitHub** ដើម្បីចូលគណនី (វានឹងភ្ជាប់គណនី Render ទៅកាន់ GitHub របស់បងដោយស្វ័យប្រវត្តិ)។

---

## ជំហានទី ២៖ បង្កើត Web Service ថ្មី
1. នៅក្នុងផ្ទាំងគ្រប់គ្រង (Dashboard) របស់ Render ចុចលើប៊ូតុង **New +** (នៅផ្នែកខាងលើស្តាំ) រួចជ្រើសរើសយក **Web Service**។
2. ជ្រើសរើស **Build and deploy from a Git repository** រួចចុច **Next**។
3. បងនឹងឃើញបញ្ជី Repository របស់បង។ សូមស្វែងរកឈ្មោះ **`businessdata168`** រួចចុចប៊ូតុង **Connect**។

---

## ជំហានទី ៣៖ កំណត់ព័ត៌មានម៉ាស៊ីន (Settings)
បំពេញព័ត៌មានដូចខាងក្រោម៖
- **Name**: `businessdata168` (ឬឈ្មោះអ្វីផ្សេងដែលបងចង់បាន)
- **Region**: ជ្រើសរើសយកប្រទេសណាដែលជិតកម្ពុជាជាងគេ (ឧទាហរណ៍៖ **Singapore**)
- **Branch**: `main`
- **Root Directory**: ទុកវាឱ្យនៅទំនេរ (blank)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: ជ្រើសរើស **Free** (ឬ **Starter** ប្រសិនបើបងចង់បាន Persistent Disk)

---

## ជំហានទី ៤៖ កំណត់ Environment Variables
1. អូសចុះមកក្រោមបន្តិច រកមើលផ្នែក **Environment Variables** (ឬចុចលើផ្នែក **Advanced**)។
2. ចុចលើ **Add Environment Variable** រួចបំពេញ៖
   - **Key**: `NODE_ENV` ➡️ **Value**: `production`
   - **Key**: `JWT_SECRET` ➡️ **Value**: `9d6c5b6277e8cb96f6cf9b7d0dbfb0aabe6ecb720742d90ac71fcb1234ea8c93` (ឬលេខកូដសម្ងាត់ផ្ទាល់ខ្លួនរបស់អ្នក)
   - **Key**: `PORT` ➡️ **Value**: `10000`

---

## ជំហានទី ៥៖ បង្កើត Persistent Disk (សម្រាប់តែគម្រោងបង់ថ្លៃ Starter Plan ប៉ុណ្ណោះ)
*ជំហាននេះជួយកុំឱ្យបាត់ទិន្នន័យនៅពេល Server ដំណើរការឡើងវិញ*
1. អូសចុះមកក្រោម រកមើលផ្នែក **Disks** (ឬចុចលើប៊ូតុង **Add Disk**)។
2. បំពេញព័ត៌មាន៖
   - **Name**: `businessdata-storage`
   - **Mount Path**: `/opt/render/project/src/businessdata`
   - **Size**: `1 GiB`
3. ចុចប៊ូតុង **Create Web Service** នៅផ្នែកខាងក្រោមបង្អស់។

---

## ជំហានទី ៦៖ ដំណើរការ និងប្រើប្រាស់
- Render នឹងចាប់ផ្តើមទាញយកកូដគម្រោងពី GitHub មកដំឡើង និងបង្កើត (Build) កូដ។ បងអាចមើលដំណើរការនេះតាមរយៈ **Logs**។
- នៅពេលដំឡើងចប់ជោគជ័យ វានឹងបង្ហាញពាក្យថា **`Your service is live`**។
- បងអាចចុចលើ Link របស់ Render (នៅផ្នែកខាងលើឆ្វេង ឧទាហរណ៍៖ `https://businessdata168.onrender.com`) ដើម្បីចូលប្រើប្រាស់កម្មវិធីរបស់អ្នកពីគ្រប់ទិសទី!

---

## 🔄 ដំណើរការ CD (Continuous Deployment)
ចាប់ពីពេលនេះទៅ រាល់ពេលដែលលោកអ្នកធ្វើការកែប្រែកូដនៅក្នុងកុំព្យូទ័រ រួចវាយបញ្ជារុញ (Push) ទៅ GitHub៖
```bash
git add .
git commit -m "Update some features"
git push
```
ប្រព័ន្ធ **Render** នឹងដឹងភ្លាមៗ រួចទាញយកកូដថ្មីទៅដំឡើង និងដំណើរការឡើងវិញដោយស្វ័យប្រវត្តិក្នុងរយៈពេលត្រឹមតែប៉ុន្មានវិនាទីប៉ុណ្ណោះ!
