'use strict';
const I18N = (() => {
 const messages = {
  "学习日历": [
    "學習日曆",
    "Study Calendar"
  ],
  "学习日历 · Study Calendar": [
    "學習日曆 · Study Calendar",
    "Study Calendar"
  ],
  "按课程查看截止日期、任务进度与成绩占比的个人学习日历": [
    "按課程查看截止日期、任務進度與成績佔比的個人學習日曆",
    "A personal calendar for course deadlines, task progress and assessment weights"
  ],
  "视图": [
    "檢視",
    "Views"
  ],
  "日历总览": [
    "日曆總覽",
    "Calendar"
  ],
  "每周课程表": [
    "每週課程表",
    "Weekly timetable"
  ],
  "所有任务": [
    "所有任務",
    "All tasks"
  ],
  "日期待定": [
    "日期待定",
    "Date TBA"
  ],
  "我的课程 / 项目": [
    "我的課程 / 項目",
    "My courses / projects"
  ],
  "管理课程": [
    "管理課程",
    "Manage courses"
  ],
  "＋ 管理课程": [
    "＋ 管理課程",
    "＋ Manage courses"
  ],
  "数据保存在本机": [
    "資料儲存在本機",
    "Data saved on this computer"
  ],
  "↓ 导出数据备份": [
    "↓ 匯出資料備份",
    "↓ Export backup"
  ],
  "☾ 切换夜间模式": [
    "☾ 切換夜間模式",
    "☾ Dark mode"
  ],
  "☀ 切换浅色模式": [
    "☀ 切換淺色模式",
    "☀ Light mode"
  ],
  "把学习安排，一起看清。": [
    "把學習安排，一起看清。",
    "Your study calendar"
  ],
  "＋ 新建任务": [
    "＋ 新建任務",
    "＋ New task"
  ],
  "任务概览": [
    "任務概覽",
    "Task overview"
  ],
  "全部任务": [
    "全部任務",
    "Total tasks"
  ],
  "本学期的每一步": [
    "本學期的每一步",
    "Every step this semester"
  ],
  "未来 7 天": [
    "未來 7 天",
    "Next 7 days"
  ],
  "有日期的待办任务": [
    "有日期的待辦任務",
    "Scheduled tasks to do"
  ],
  "已完成": [
    "已完成",
    "Completed"
  ],
  "持续积累，慢慢推进": [
    "持續累積，慢慢推進",
    "Keep making progress"
  ],
  "保留关注，不会遗漏": [
    "保持關注，不會遺漏",
    "Keep track of what's next"
  ],
  "上个月": [
    "上個月",
    "Previous month"
  ],
  "下个月": [
    "下個月",
    "Next month"
  ],
  "今天": [
    "今天",
    "Today"
  ],
  "显示已完成": [
    "顯示已完成",
    "Show completed"
  ],
  "全部课程": [
    "全部課程",
    "All courses"
  ],
  "香港时间 · 点击任务编辑": [
    "香港時間 · 點擊任務編輯",
    "Hong Kong time · Click a task to edit"
  ],
  "周一": [
    "週一",
    "Mon"
  ],
  "周二": [
    "週二",
    "Tue"
  ],
  "周三": [
    "週三",
    "Wed"
  ],
  "周四": [
    "週四",
    "Thu"
  ],
  "周五": [
    "週五",
    "Fri"
  ],
  "周六": [
    "週六",
    "Sat"
  ],
  "周日": [
    "週日",
    "Sun"
  ],
  "已确认日期": [
    "已確認日期",
    "Confirmed date"
  ],
  "暂定日期": [
    "暫定日期",
    "Tentative date"
  ],
  "蓝色填充表示完成进度": [
    "藍色填充表示完成進度",
    "Blue fill shows progress"
  ],
  "时间待定的任务按日期展示": [
    "時間待定的任務按日期顯示",
    "Tasks without a time appear on their date"
  ],
  "接下来": [
    "接下來",
    "Up next"
  ],
  "等待日期公布": [
    "等待日期公佈",
    "Awaiting dates"
  ],
  "考试、展示与长期任务也都在这里。": [
    "考試、展示與長期任務也都在這裡。",
    "Exams, presentations and long-term tasks are here too."
  ],
  "查看待定任务 →": [
    "查看待定任務 →",
    "View undated tasks →"
  ],
  "按自己的节奏推进。": [
    "按自己的節奏推進。",
    "Move at your own pace."
  ],
  "进度与成绩占比分开记录": [
    "進度與成績佔比分開記錄",
    "Progress and grade weights are tracked separately"
  ],
  "新建任务": [
    "新建任務",
    "New task"
  ],
  "任务详情": [
    "任務詳情",
    "Task details"
  ],
  "关闭": [
    "關閉",
    "Close"
  ],
  "任务名称": [
    "任務名稱",
    "Task name"
  ],
  "例如：复习 Chapter 3": [
    "例如：溫習 Chapter 3",
    "e.g. Review Chapter 3"
  ],
  "所属课程 / 项目": [
    "所屬課程 / 項目",
    "Course / project"
  ],
  "在 Finder 中打开课程文件夹 ↗": [
    "在 Finder 中開啟課程資料夾 ↗",
    "Open course folder in Finder ↗"
  ],
  "日期": [
    "日期",
    "Date"
  ],
  "时间（可留空）": [
    "時間（可留空）",
    "Time (optional)"
  ],
  "这是暂定日期，之后需要确认": [
    "這是暫定日期，之後需要確認",
    "This date is tentative and needs confirmation"
  ],
  "完成进度": [
    "完成進度",
    "Completion"
  ],
  "未开始": [
    "未開始",
    "Not started"
  ],
  "总成绩占比": [
    "總成績佔比",
    "Weight in final grade"
  ],
  "例如：25%，或整类作业合计 5%": [
    "例如：25%，或整類作業合計 5%",
    "e.g. 25%, or all assignments combined: 5%"
  ],
  "类别合计不代表单项分值；复习任务可以留空。": [
    "類別合計不代表單項分值；溫習任務可以留空。",
    "A category total is not an individual task's weight. Leave blank for revision."
  ],
  "备注与来源": [
    "備註與來源",
    "Notes and sources"
  ],
  "章节、要求、Moodle 来源链接……": [
    "章節、要求、Moodle 來源連結……",
    "Chapters, requirements, Moodle source links…"
  ],
  "删除任务": [
    "刪除任務",
    "Delete task"
  ],
  "取消": [
    "取消",
    "Cancel"
  ],
  "保存任务": [
    "儲存任務",
    "Save task"
  ],
  "关闭课程管理": [
    "關閉課程管理",
    "Close course manager"
  ],
  "名称": [
    "名稱",
    "Name"
  ],
  "课程编号或项目名称": [
    "課程編號或項目名稱",
    "Course code or project name"
  ],
  "颜色": [
    "顏色",
    "Colour"
  ],
  "新建课程": [
    "新建課程",
    "New course"
  ],
  "保存课程": [
    "儲存課程",
    "Save course"
  ],
  "语言": [
    "語言",
    "Language"
  ],
  "未分类": [
    "未分類",
    "Uncategorised"
  ],
  "自定学习任务": [
    "自訂學習任務",
    "Personal study task"
  ],
  "无独立占比": [
    "無獨立佔比",
    "No separate weight"
  ],
  "占比待定": [
    "佔比待定",
    "Weight TBA"
  ],
  "类别合计 {value}": [
    "類別合計 {value}",
    "Category total: {value}"
  ],
  "占比 {value}": [
    "佔比 {value}",
    "Weight: {value}"
  ],
  "时间待定": [
    "時間待定",
    "Time TBA"
  ],
  "暂定": [
    "暫定",
    "Tentative"
  ],
  "保存失败，请重试": [
    "儲存失敗，請重試",
    "Could not save. Please try again."
  ],
  "暂时无法连接本机服务，请重新打开启动文件，再刷新网页。": [
    "暫時無法連接本機服務，請重新開啟啟動檔案，再重新整理網頁。",
    "Cannot connect to the local service. Reopen the launcher, then reload this page."
  ],
  "{value}% 平均任务进度": [
    "{value}% 平均任務進度",
    "{value}% average progress"
  ],
  "{count} 项已安排": [
    "{count} 項已安排",
    "{count} scheduled"
  ],
  "已过期 · ": [
    "已過期 · ",
    "Overdue · "
  ],
  "暂时没有待办截止任务。": [
    "暫時沒有待辦截止任務。",
    "No pending deadlines."
  ],
  "课程评分组成": [
    "課程評分組成",
    "Course assessment breakdown"
  ],
  "评分组成": [
    "評分組成",
    "Assessment breakdown"
  ],
  "各部分占课程总成绩的比例": [
    "各部分佔課程總成績的比例",
    "Each component's share of the final grade"
  ],
  "评分比例合计不是100%，请核对资料。": [
    "評分比例合計不是100%，請核對資料。",
    "Weights do not add up to 100%. Please check the sources."
  ],
  "比例待确认": [
    "比例待確認",
    "Weights unconfirmed"
  ],
  "合计 100%": [
    "合計 100%",
    "Total 100%"
  ],
  "{course}评分组成饼图": [
    "{course}評分組成圓餅圖",
    "{course} assessment pie chart"
  ],
  "全部评分部分 · 100%": [
    "全部評分部分 · 100%",
    "All components · 100%"
  ],
  "查看评分依据": [
    "查看評分依據",
    "View grading sources"
  ],
  "核对日期": [
    "核對日期",
    "Checked on"
  ],
  "在{date}新建任务": [
    "在{date}新建任務",
    "Create a task on {date}"
  ],
  "进度": [
    "進度",
    "Progress"
  ],
  "这里暂时没有任务，可以新建一项。": [
    "這裡暫時沒有任務，可以新增一項。",
    "No tasks here yet. Create one to get started."
  ],
  "常规周课表": [
    "常規週課表",
    "Regular weekly timetable"
  ],
  "当前四门线下课程": [
    "目前四門實體課程",
    "Four in-person courses"
  ],
  "{count} 个时段 · 香港时间": [
    "{count} 個時段 · 香港時間",
    "{count} sessions · Hong Kong time"
  ],
  "时间": [
    "時間",
    "Time"
  ],
  "没有课程": [
    "沒有課程",
    "No classes"
  ],
  "Tutorial 登记核查": [
    "Tutorial 登記核查",
    "Tutorial registration check"
  ],
  "核查于": [
    "核查於",
    "Checked on"
  ],
  "任务已保存": [
    "任務已儲存",
    "Task saved"
  ],
  "这门课程尚未关联本地文件夹": [
    "這門課程尚未關聯本機資料夾",
    "No local folder linked to this course"
  ],
  "正在打开…": [
    "正在開啟…",
    "Opening…"
  ],
  "已在Finder打开 {folder}": [
    "已在 Finder 開啟 {folder}",
    "Opened {folder} in Finder"
  ],
  "确定删除这项任务？": [
    "確定刪除這項任務？",
    "Delete this task?"
  ],
  "任务已删除": [
    "任務已刪除",
    "Task deleted"
  ],
  "编辑": [
    "編輯",
    "Edit"
  ],
  "删除": [
    "刪除",
    "Delete"
  ],
  "删除 {course}？有任务的课程需要先移动任务。": [
    "刪除 {course}？有任務的課程需要先移動任務。",
    "Delete {course}? Move its tasks to another course first."
  ],
  "课程已删除": [
    "課程已刪除",
    "Course deleted"
  ],
  "课程已保存": [
    "課程已儲存",
    "Course saved"
  ],
  "备份已导出": [
    "備份已匯出",
    "Backup exported"
  ],
  "请填写任务名称（不超过300字）": [
    "請填寫任務名稱（不超過300字）",
    "Enter a task name (up to 300 characters)."
  ],
  "请选择有效课程": [
    "請選擇有效課程",
    "Select a valid course."
  ],
  "日期格式不正确": [
    "日期格式不正確",
    "Invalid date format."
  ],
  "设置时间前请先选择日期": [
    "設定時間前請先選擇日期",
    "Choose a date before setting a time."
  ],
  "进度应为0到100的整数": [
    "進度應為0到100的整數",
    "Progress must be a whole number from 0 to 100."
  ],
  "填写内容过长": [
    "填寫內容過長",
    "The entered text is too long."
  ],
  "不允许的来源": [
    "不允許的來源",
    "Request origin not allowed."
  ],
  "不存在的接口": [
    "不存在的介面",
    "Endpoint not found."
  ],
  "需要JSON数据": [
    "需要 JSON 資料",
    "JSON data required."
  ],
  "请求过大": [
    "請求過大",
    "Request too large."
  ],
  "请求内容必须是JSON对象": [
    "請求內容必須是 JSON 物件",
    "The request must be a JSON object."
  ],
  "课程文件夹不存在，可能已被移动或重命名": [
    "課程資料夾不存在，可能已被移動或重新命名",
    "Course folder not found. It may have been moved or renamed."
  ],
  "暂时无法打开Finder，请重试": [
    "暫時無法開啟 Finder，請重試",
    "Could not open Finder. Please try again."
  ],
  "缺少编号": [
    "缺少編號",
    "Missing ID."
  ],
  "记录不存在，请刷新": [
    "記錄不存在，請重新整理",
    "Record not found. Reload the page."
  ],
  "请先移动或删除这门课程的任务": [
    "請先移動或刪除這門課程的任務",
    "Move or delete this course's tasks first."
  ],
  "请填写课程名称（不超过80字）": [
    "請填寫課程名稱（不超過80字）",
    "Enter a course name (up to 80 characters)."
  ],
  "请选择有效颜色": [
    "請選擇有效顏色",
    "Select a valid colour."
  ],
  "数据暂时无法保存，请保留填写内容并重试": [
    "資料暫時無法儲存，請保留填寫內容並重試",
    "Could not save the data. Keep your entries and try again."
  ],
  "Lecture 参与": [
    "Lecture 參與",
    "Lecture participation"
  ],
  "Tutorial 参与": [
    "Tutorial 參與",
    "Tutorial participation"
  ],
  "作业（合计）": [
    "作業（合計）",
    "Assignments (total)"
  ],
  "期中考试": [
    "期中考試",
    "Midterm exam"
  ],
  "小组项目": [
    "小組項目",
    "Group project"
  ],
  "期末考试": [
    "期末考試",
    "Final exam"
  ],
  "自学材料": [
    "自學材料",
    "Self-study materials"
  ],
  "期中检查": [
    "期中檢查",
    "Midterm check-in"
  ],
  "Proposal 同伴互评": [
    "Proposal 同儕互評",
    "Proposal peer review"
  ],
  "期末跨组互评": [
    "期末跨組互評",
    "Final cross-group peer review"
  ],
  "项目报告": [
    "項目報告",
    "Project report"
  ],
  "代码与可复现性": [
    "程式碼與可重現性",
    "Code and reproducibility"
  ],
  "项目网页及演示": [
    "項目網頁及演示",
    "Project website and demo"
  ],
  "初步案例报告": [
    "初步案例報告",
    "Preliminary case report"
  ],
  "写作咨询": [
    "寫作諮詢",
    "Writing consultation"
  ],
  "最终案例报告": [
    "最終案例報告",
    "Final case report"
  ],
  "口头展示": [
    "口頭展示",
    "Oral presentation"
  ],
  "Checkpoint（合计）": [
    "Checkpoint（合計）",
    "Checkpoints (total)"
  ],
  "编程作业（3次合计）": [
    "程式設計作業（3次合計）",
    "Programming assignments (3 combined)"
  ],
  "编程项目": [
    "程式設計項目",
    "Programming project"
  ],
  "已分组": [
    "已分組",
    "Group assigned"
  ],
  "已登记": [
    "已登記",
    "Registered"
  ],
  "无需固定组别": [
    "無需固定組別",
    "No fixed group required"
  ],
  "无单独tutorial组": [
    "無單獨 tutorial 組",
    "No separate tutorial group"
  ],
  "无固定tutorial组": [
    "無固定 tutorial 組",
    "No fixed tutorial group"
  ],
  "作业5%是整类合计，不是每份作业各占5%。": [
    "作業5%是整類合計，不是每份作業各佔5%。",
    "The 5% covers all assignments combined, not each assignment."
  ],
  "参与部分40%，项目部分60%。团队咨询的独立权重未公布，不额外叠加；总评为Distinction / Pass / Fail。": [
    "參與部分40%，項目部分60%。團隊諮詢的獨立權重未公佈，不額外疊加；總評為Distinction / Pass / Fail。",
    "Participation is 40% and the project is 60%. No separate weight is published for the team consultation, so none is added. Overall results are Distinction / Pass / Fail."
  ],
  "初步报告为个人评分；最终报告为小组评分；口头展示由小组完成、个人评分。": [
    "初步報告為個人評分；最終報告為小組評分；口頭展示由小組完成、個人評分。",
    "The preliminary report is graded individually; the final report is graded as a group. The oral presentation is delivered as a group and graded individually."
  ],
  "课件写3次作业合计30%，没有说明各份均分。": [
    "課件寫3次作業合計30%，沒有說明各份均分。",
    "The slides assign 30% to three assignments combined; equal individual weights are not specified."
  ],
  "Tutorial占比10%，未进一步细分出勤、参与或课堂练习。": [
    "Tutorial佔比10%，未進一步細分出勤、參與或課堂練習。",
    "Tutorials account for 10%; attendance, participation and in-class exercises are not broken down further."
  ],
  "Reading Week · 阅读周": [
    "Reading Week · 閱讀週",
    "Reading / Field Trip Week"
  ],
  "Revision Period · 复习期": [
    "Revision Period · 溫習期",
    "Revision Period"
  ],
  "Assessment Period · 考试期": [
    "Assessment Period · 考試期",
    "Assessment Period"
  ],
  "Semester Break · 学期间休假": [
    "Semester Break · 學期間休假",
    "Semester Break"
  ],
  "农历新年停课": [
    "農曆新年停課",
    "Lunar New Year class suspension"
  ],
  "中秋节翌日": [
    "中秋節翌日",
    "Day after Mid-Autumn Festival"
  ],
  "国庆日": [
    "國慶日",
    "National Day"
  ],
  "重阳节翌日": [
    "重陽節翌日",
    "Day after Chung Yeung Festival"
  ],
  "圣诞节": [
    "聖誕節",
    "Christmas Day"
  ],
  "圣诞节后第一个周日": [
    "聖誕節後第一個周日",
    "First weekday after Christmas Day"
  ],
  "元旦": [
    "元旦",
    "New Year's Day"
  ],
  "农历年初一": [
    "農曆年初一",
    "Lunar New Year's Day"
  ],
  "农历年初三": [
    "農曆年初三",
    "Third day of Lunar New Year"
  ],
  "农历年初四": [
    "農曆年初四",
    "Fourth day of Lunar New Year"
  ],
  "耶稣受难节": [
    "耶穌受難節",
    "Good Friday"
  ],
  "耶稣受难节翌日": [
    "耶穌受難節翌日",
    "Day after Good Friday"
  ],
  "复活节星期一": [
    "復活節星期一",
    "Easter Monday"
  ],
  "清明节": [
    "清明節",
    "Ching Ming Festival"
  ],
  "劳动节": [
    "勞動節",
    "Labour Day"
  ],
  "佛诞": [
    "佛誕",
    "Buddha's Birthday"
  ],
  "端午节": [
    "端午節",
    "Tuen Ng Festival"
  ],
  "香港特区成立纪念日": [
    "香港特區成立紀念日",
    "HKSAR Establishment Day"
  ],
  "大学假期（全天）": [
    "大學假期（全天）",
    "University holiday (full day)"
  ],
  "大学假期（仅下午）": [
    "大學假期（僅下午）",
    "University holiday (afternoon only)"
  ],
  "校历：假期 / 非授课安排": [
    "校曆：假期 / 非授課安排",
    "Academic calendar: holidays / non-teaching periods"
  ],
  "阅读／考察周；按校历暂停常规授课，课程活动及作业仍以教师安排为准。": [
    "閱讀／考察週；按校曆暫停常規授課，課程活動及作業仍以教師安排為準。",
    "Reading / Field Trip Week; regular teaching pauses under the calendar. Course activities and assignments still follow the instructor's arrangements."
  ],
  "复习期；无常规授课，仍需留意作业及考试安排。": [
    "溫習期；無常規授課，仍需留意作業及考試安排。",
    "Revision period; no regular teaching. Keep track of assignments and exams."
  ],
  "考试／评核期，不是放假；请按个人考试及评核安排出席。": [
    "考試／評核期，並非放假；請按個人考試及評核安排出席。",
    "Assessment period, not a holiday. Attend your scheduled exams and assessments."
  ],
  "第一学期结束至第二学期开课前的休假；日期按校历学期边界整理。": [
    "第一學期結束至第二學期開課前的休假；日期按校曆學期邊界整理。",
    "Break between the first semester and the start of second-semester teaching; dates derived from the calendar's semester boundaries."
  ],
  "第二学期结束至可选暑期学期开始前的休假；日期按校历学期边界整理。": [
    "第二學期結束至可選暑期學期開始前的休假；日期按校曆學期邊界整理。",
    "Break after the second semester and before the optional summer semester; dates derived from the calendar's semester boundaries."
  ],
  "校历列明的农历新年停课期：2月6日至12日。": [
    "校曆列明的農曆新年停課期：2月6日至12日。",
    "Lunar New Year class suspension listed in the calendar: 6–12 February."
  ],
  "公众假期；依照所提供校历的方括号标记。": [
    "公眾假期；依照所提供校曆的方括號標記。",
    "General holiday, shown in square brackets in the supplied calendar."
  ],
  "校历圆括号标记：大学假期，全天。": [
    "校曆圓括號標記：大學假期，全天。",
    "University holiday, full day, shown in round brackets in the calendar."
  ],
  "校历尖括号标记：仅下午为大学假期，上午不按全天假期处理。": [
    "校曆尖括號標記：僅下午為大學假期，上午不按全天假期處理。",
    "University holiday in the afternoon only, shown in angle brackets. The morning is not marked as a holiday."
  ],
  "按你提供的2026–27校历标记；Reading Week可能有考察或课程活动，考试期仍需参加评核。各学院及课程的特别安排以通知为准。": [
    "按你提供的2026–27校曆標記；Reading Week可能有考察或課程活動，考試期仍需參加評核。各學院及課程的特別安排以通知為準。",
    "Based on your 2026–27 calendar. Reading Week may include field trips or course activities; assessments still take place during Assessment Period. Faculty and course notices take precedence."
  ],
  "{course}：在新标签页打开 Moodle": [
    "{course}：在新分頁開啟 Moodle",
    "{course}: open Moodle in a new tab"
  ],
  "打开课程文件夹 ↗": [
    "開啟課程資料夾 ↗",
    "Open course folder ↗"
  ],
  "已打开文件夹 {folder}": [
    "已開啟資料夾 {folder}",
    "Opened folder {folder}"
  ],
  "这门课程尚未配置固定时段。": [
    "這門課程尚未設定固定時段。",
    "No timetable has been configured for this course."
  ],
  "AI 导入": [
    "AI 匯入",
    "AI import"
  ],
  "API 设置": [
    "API 設定",
    "API settings"
  ],
  "导入与审核": [
    "匯入與審核",
    "Import and review"
  ],
  "只使用公开或自写的虚构课程文件。预览不会调用模型；确认候选前不会修改日历。": [
    "只使用公開或自寫的虛構課程文件。預覽不會呼叫模型；確認候選前不會修改日曆。",
    "Use public or self-authored fictional documents. Preview makes no model call; the calendar changes only after confirmation."
  ],
  "课程": [
    "課程",
    "Course"
  ],
  "载入虚构示例课程": [
    "載入虛構範例課程",
    "Load fictional demo course"
  ],
  "选择文件并预览": [
    "選擇檔案並預覽",
    "Choose documents and preview"
  ],
  "选择文件夹": [
    "選擇資料夾",
    "Choose folder"
  ],
  "选择文件": [
    "選擇檔案",
    "Choose files"
  ],
  "或关联本机文件夹路径": [
    "或關聯本機資料夾路徑",
    "Or associate a folder path on this computer"
  ],
  "保存文件夹关联": [
    "儲存資料夾關聯",
    "Save folder association"
  ],
  "预览文本与变化": [
    "預覽文字與變更",
    "Preview text and changes"
  ],
  "选择处理方式": [
    "選擇處理方式",
    "Choose processing mode"
  ],
  "方式": [
    "方式",
    "Mode"
  ],
  "示例回放（固定样例，非实时 AI）": [
    "範例回放（固定樣本，非即時 AI）",
    "Fixture replay (stored outputs, not live AI)"
  ],
  "实时 API 提取": [
    "即時 API 擷取",
    "Live API extraction"
  ],
  "重新分析已处理文件": [
    "重新分析已處理檔案",
    "Re-analyse processed files"
  ],
  "我确认将所选文件的全部预览文本发送到上述模型服务。": [
    "我確認將所選檔案的全部預覽文字傳送至上述模型服務。",
    "I confirm sending all previewed text from the selected files to the provider above."
  ],
  "提取为待审核候选": [
    "擷取為待審候選",
    "Extract review candidates"
  ],
  "核对证据并确认": [
    "核對證據並確認",
    "Check evidence and confirm"
  ],
  "刷新候选": [
    "重新整理候選",
    "Refresh candidates"
  ],
  "密钥只保存于本机私有配置，不返回浏览器、不进入代码仓库。模型调用会发送你确认的文本。": [
    "金鑰只儲存在本機私人設定，不傳回瀏覽器、不進入程式碼儲存庫。模型會收到你確認的文字。",
    "Keys stay in private local configuration and are never returned to the browser or included in the repository. Model calls send the text you confirm."
  ],
  "清除已保存的密钥": [
    "清除已儲存金鑰",
    "Clear saved key"
  ],
  "保存设置": [
    "儲存設定",
    "Save settings"
  ],
  "连接测试（会发送一条虚构请求）": [
    "連線測試（會傳送一則虛構請求）",
    "Test connection (sends a synthetic request)"
  ],
  "处理中…": [
    "處理中…",
    "Working…"
  ],
  "将读取仓库自带的虚构文件夹": [
    "將讀取儲存庫內的虛構資料夾",
    "Using the bundled fictional course folder"
  ],
  "示例课程已就绪，点击预览。": [
    "範例課程已就緒，請預覽。",
    "Demo course ready. Preview its files."
  ],
  "个文件已选择": [
    "個檔案已選取",
    "files selected"
  ],
  "将读取已关联的本机文件夹": [
    "將讀取已關聯的本機資料夾",
    "Using the associated local folder"
  ],
  "文件夹关联已保存。": [
    "資料夾關聯已儲存。",
    "Folder association saved."
  ],
  "先创建或选择一门课程。": [
    "請先建立或選擇課程。",
    "Create or select a course first."
  ],
  "最多20份文件，每份2MB，总计10MB。": [
    "最多20份檔案，每份2MB，總計10MB。",
    "Maximum 20 files, 2 MB per file, 10 MB total."
  ],
  "处文本": [
    "處文字",
    "text units"
  ],
  "同内容副本": [
    "相同內容副本",
    "Identical content copy"
  ],
  "已处理过的内容": [
    "已處理的內容",
    "Previously processed content"
  ],
  "新内容": [
    "新內容",
    "New content"
  ],
  "查看将被处理的完整文本": [
    "查看將處理的完整文字",
    "Inspect the full text to be processed"
  ],
  "预览完成；尚未调用模型或修改日历。": [
    "預覽完成；尚未呼叫模型或修改日曆。",
    "Preview ready. No model call or calendar changes yet."
  ],
  "实时模式目标": [
    "即時模式目標",
    "Live provider"
  ],
  "回放模式不发送网络请求。": [
    "回放模式不傳送網路請求。",
    "Replay makes no network calls."
  ],
  "请先预览文件。": [
    "請先預覽檔案。",
    "Preview documents first."
  ],
  "实时模式需要确认文本发送范围。": [
    "即時模式需要確認文字傳送範圍。",
    "Live mode requires confirmation of text transmission."
  ],
  "正在逐份处理，请保持窗口打开…": [
    "正在逐份處理，請保持視窗開啟…",
    "Processing files sequentially. Keep this window open…"
  ],
  "示例回放 · 非实时推理": [
    "範例回放 · 非即時推理",
    "FIXTURE REPLAY · NOT LIVE INFERENCE"
  ],
  "个候选": [
    "個候選",
    "candidates"
  ],
  "处理完成。日历尚未改变，请逐项核对候选。": [
    "處理完成。日曆尚未變更，請逐項核對候選。",
    "Processing complete. The calendar is unchanged. Review each candidate."
  ],
  "创建新任务": [
    "建立新任務",
    "Create a new task"
  ],
  "存在不同截止日期；请核对所有来源，系统不会自动选择。": [
    "存在不同截止日期；請核對所有來源，系統不會自動選擇。",
    "Conflicting deadlines: inspect all sources. The app does not choose one automatically."
  ],
  "原任务已被修改。请拒绝并重新分析，避免覆盖较新的编辑。": [
    "原任務已修改。請拒絕並重新分析，以免覆蓋新編輯。",
    "The saved task changed. Reject and re-analyse to preserve newer edits."
  ],
  "存在同名任务，请在下面选择更新对象或明确保留为独立任务。": [
    "存在同名任務，請選擇更新對象或明確保留為獨立任務。",
    "A same-title task exists. Choose an update target or explicitly keep it separate."
  ],
  "写入方式": [
    "寫入方式",
    "Save as"
  ],
  "当前记录": [
    "目前記錄",
    "Current saved task"
  ],
  "提交要求": [
    "提交要求",
    "Submission requirements"
  ],
  "未明确": [
    "未明確",
    "Not specified"
  ],
  "原文证据": [
    "原文證據",
    "Source evidence"
  ],
  "已核对来源、日期及潜在重复／冲突，确认以上内容。": [
    "已核對來源、日期及潛在重複／衝突，確認以上內容。",
    "I checked sources, dates and possible duplicates/conflicts and confirm this content."
  ],
  "确认写入日历": [
    "確認寫入日曆",
    "Confirm and save to calendar"
  ],
  "拒绝候选": [
    "拒絕候選",
    "Reject candidate"
  ],
  "没有待审核候选。": [
    "沒有待審候選。",
    "No candidates awaiting review."
  ],
  "已接受": [
    "已接受",
    "Accepted"
  ],
  "已拒绝": [
    "已拒絕",
    "Rejected"
  ],
  "已确认并保存到日历。": [
    "已確認並儲存至日曆。",
    "Confirmed and saved to the calendar."
  ],
  "候选已拒绝，日历未修改。": [
    "候選已拒絕，日曆未修改。",
    "Candidate rejected; calendar unchanged."
  ],
  "已配置密钥（不会显示密钥）": [
    "已設定金鑰（不顯示金鑰）",
    "Key configured (never displayed)"
  ],
  "尚未配置密钥": [
    "尚未設定金鑰",
    "No API key configured"
  ],
  "设置已保存。": [
    "設定已儲存。",
    "Settings saved."
  ],
  "连接测试成功。": [
    "連線測試成功。",
    "Connection test succeeded."
  ]
};
 const supported=['zh-Hans','zh-Hant','en'];
 let language='zh-Hans';
 try {const saved=localStorage.getItem('study-language');if(supported.includes(saved))language=saved;} catch {}
 function tr(key='',vars={}) {
  const text=language==='zh-Hans'?key:(messages[key]?.[language==='zh-Hant'?0:1]??key);
  return text.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??`{${name}}`));
 }
 // Capture only authored static text before the app renders user records.
 const textNodes=[],attributes=[];
 const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()) {
  const node=walker.currentNode,key=node.nodeValue.trim();
  if(messages[key] && !node.parentElement.closest('script,style,select'))
   textNodes.push({node,key,prefix:node.nodeValue.match(/^\s*/)[0],suffix:node.nodeValue.match(/\s*$/)[0]});
 }
 document.querySelectorAll('*').forEach(node=>{
  for(const attr of ['aria-label','placeholder','title','content']) {
   const key=node.getAttribute(attr);if(messages[key])attributes.push({node,attr,key});
  }
 });
 function applyStatic(){
  document.documentElement.lang=language;
  textNodes.forEach(({node,key,prefix,suffix})=>{if(node.isConnected)node.nodeValue=prefix+tr(key)+suffix;});
  attributes.forEach(({node,attr,key})=>node.setAttribute(attr,tr(key)));
  document.querySelector('#language').value=language;
 }
 return {tr,applyStatic,get language(){return language;},get locale(){return {'zh-Hans':'zh-CN','zh-Hant':'zh-HK',en:'en-GB'}[language];},
  setLanguage(value){if(!supported.includes(value))return;language=value;try{localStorage.setItem('study-language',value);}catch{}applyStatic();}};
})();
const tr=I18N.tr;
