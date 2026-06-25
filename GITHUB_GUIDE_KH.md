# របៀបភ្ជាប់កូដទៅកាន់ GitHub (How to Connect Your Code to GitHub)

ខាងក្រោមនេះជាការណែនាំជាជំហានៗក្នុងការដំឡើង និងរុញកូដគម្រោងរបស់អ្នកទៅកាន់ GitHub។

---

## ជំហានទី ១៖ ទាញយក និងដំឡើងកម្មវិធី Git (ប្រសិនបើមិនទាន់មាន)
ដោយសារកុំព្យូទ័ររបស់អ្នកមិនទាន់ស្គាល់បញ្ជា `git` អ្នកត្រូវដំឡើងកម្មវិធីវាជាមុនសិន៖
1. ចូលទៅកាន់គេហទំព័រផ្លូវការ៖ [git-scm.com/downloads](https://git-scm.com/downloads)
2. ទាញយកកម្មវិធីសម្រាប់ **Windows**។
3. បើកហ្វាយដែលបានទាញយករួច ចុច **Next** រហូតដល់ចប់ ដើម្បីបញ្ចប់ការដំឡើង។

*បន្ទាប់ពីដំឡើងរួច សូមបិទ Terminal ឬ PowerShell រួចបើកវាឡើងវិញ ដើម្បីឱ្យវាស្គាល់បញ្ជា `git`*។

---

## ជំហានទី ២៖ បង្កើត Repository ថ្មីនៅលើ GitHub
1. ចូលទៅកាន់គណនី GitHub របស់អ្នកនៅ [github.com](https://github.com) (បង្កើតគណនីថ្មីប្រសិនបើមិនទាន់មាន)។
2. នៅជ្រុងខាងលើផ្នែកខាងស្តាំ ចុចលើសញ្ញា **`+`** រួចជ្រើសរើសយក **New repository**។
3. បំពេញព័ត៌មាន៖
   - **Repository name**: `customer-&-product-manager` (ឬឈ្មោះអ្វីផ្សេងដែលអ្នកចង់បាន)
   - **Visibility**: ជ្រើសរើស **Public** (បើកចំហជាសាធារណៈ) ឬ **Private** (រក្សាទុកជាឯកជន)
   - **សំខាន់បំផុត**៖ **កុំ** ធ្លាក់គ្រីសយក (Uncheck) លើ *Add a README file*, *Add .gitignore* ឬ *Choose a license* ឡើយ ព្រោះកូដរបស់យើងមានហ្វាយទាំងនេះរួចរាល់ហើយ។
4. ចុចលើប៊ូតុង **Create repository**។

---

## ជំហានទី ៣៖ កំណត់ព័ត៌មានគណនី Git (ធ្វើតែម្តងដំបូងប៉ុណ្ណោះ)
បើកកម្មវិធី **Terminal** ឬ **PowerShell** នៅក្នុងកុំព្យូទ័ររបស់អ្នក រួចវាយបញ្ជាខាងក្រោម ដើម្បីកំណត់អត្តសញ្ញាណ៖
```bash
git config --global user.name "ឈ្មោះគណនី GitHub របស់អ្នក"
git config --global user.email "អ៊ីមែលដែលប្រើជាមួយ GitHub របស់អ្នក"
```

---

## ជំហានទី ៤៖ រុញកូដពីកុំព្យូទ័រទៅកាន់ GitHub
សូមបើក **PowerShell** ឬ **Terminal** នៅក្នុងថតគម្រោងរបស់អ្នក (`c:/Users/ROG SCAR G15/Downloads/customer-&-product-manager`) រួចដំណើរការបញ្ជាខាងក្រោមម្តងមួយៗ៖

```bash
# ១. ចាប់ផ្តើមបង្កើត Git local repository ក្នុងម៉ាស៊ីន
git init

# ២. បន្ថែមរាល់ឯកសារទាំងអស់ចូលទៅក្នុង Git tracking
git add .

# ៣. សរសេរកំណត់ត្រាការ Commit ដំបូង
git commit -m "Initial commit - setup project with customer and product manager"

# ៤. បង្កើត Branch ឈ្មោះ main
git branch -M main

# ៥. ភ្ជាប់កូដក្នុងម៉ាស៊ីនទៅកាន់ GitHub Link របស់អ្នក
# (សូមប្តូរ URL ខាងក្រោមទៅជា URL Repository របស់លោកអ្នកដែលបានបង្កើតនៅជំហានទី ២)
git remote add origin https://github.com/ឈ្មោះគណនីរបស់អ្នក/customer-&-product-manager.git

# ៦. រុញកូដឡើងទៅកាន់ GitHub
git push -u origin main
```

> [!NOTE]
> នៅពេលអ្នកដំណើរការបញ្ជា `git push` ជាលើកដំបូង ប្រព័ន្ធនឹងបង្ហាញផ្ទាំងមួយឱ្យអ្នកធ្វើការ **Sign in with your browser** ដើម្បីផ្ទៀងផ្ទាត់សិទ្ធិគណនី GitHub របស់អ្នក។ លោកអ្នកគ្រាន់តែចុចយល់ព្រមតាមការណែនាំជាការស្រេច។
