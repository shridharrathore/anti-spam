1. Build an Anti Spam System
2. Detect spam on telecom side itself and block it and does not reach user
3. Even if it reaches user, we will mark it suspected-spam before the message
4. Phone number of incoming will display this is promotional or marketing call or suspected spam.
5. UI will have home page after login.
6. Home page can be divided into tabs - SMS and calls
7. SMS tab will have summary of last one week of detected and blocked spams and unique type of spam message eg. if same spam sent to 1000 people but unique is one. And a list of sequence, type , sms context, sms list. The list should be expandable that which type of sms are in that category eg. lottery winning message with links to click or asking to call for lottery winnings. Both fall in same category.
8. next column will have in this duration we blocked these many messages and unique phoen numbers associated, top 10 spam senders.
9. Filter , sorting etc option
10. text box at top to test a message where a sample text can be submitted and system can identify if this is spam with confidence percentage.
11. This text box will be linked to LLM call and at backedn a prompt will be created to check if this is spam and share the data in format: Spam(yes, no) and confidence
12. next tab is for call - total number of spam callers detecetd, no of callers blocked , similar to text data. Below again a table similar to text showing numbers, when blocked, how many unique numbers did the person called
13. Postgress database so that values can be saved in different tables
14. 3rd tab will be home with overall summary for text and calls and show dashboard with charts etc with drilldown, download etc

This dashboard will be used by admin of telecom operator to check the performance and do analytics of spam detecting system. The UI should look professional and smooth like apple
