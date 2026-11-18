/**
 * SheSync — Period Tracker Survey (Google Form builder)
 *
 * HOW TO USE
 * 1. Go to https://script.google.com and click "New project".
 * 2. Delete the sample code, paste this whole file, and click Save.
 * 3. Choose the function "createSheSyncSurvey" and click Run.
 * 4. Allow the permissions Google asks for (it needs to create a Form and a Sheet in your Drive).
 * 5. Open View > Logs (or "Execution log"): it prints the link to share and the link to edit.
 *
 * DESIGN CHOICES
 * - Anonymous: no name, email or phone is ever asked, and email collection is off.
 * - 18+ only: under-18s are thanked and the form ends (minors' data needs parental consent under India's DPDP law).
 * - Sensitive questions are optional and always include "Prefer not to say".
 * - Every question has ready-made options to tap; most also end with "Other" so people can type their own answer.
 *   (Google Forms does not allow "Other" on yes/no gates, grids, or questions that send people to different sections.)
 * - Takes about 5–6 minutes.
 * - App users and non-users get different sections; AI users get an extra AI section; everyone sees the wishlist.
 */

function createSheSyncSurvey() {
  var PREFER_NOT = 'Prefer not to say';

  var form = FormApp.create('Your Period, Your Way — a 5-minute anonymous survey');
  form.setDescription(
    'Hi! 👋 We are students building SheSync, a period and wellness app made for Indian women.\n\n' +
    'We want to learn how you track your period today and what an app should do better.\n\n' +
    '🔒 This survey is 100% anonymous. We never ask your name, email or phone number.\n' +
    '⏱️ It takes about 5 minutes — mostly just tapping options.\n' +
    '🙂 There are no right or wrong answers, and you can skip anything you are not comfortable with.\n\n' +
    'Your answers are used only to design the app and are never sold or shared.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'Thank you so much! 💗 Your answers will directly shape SheSync.\n' +
    'Please share this survey with friends — the more voices, the better the app.'
  );

  // ─── Section 1: Quick check ──────────────────────────────────
  var ageCheck = form.addMultipleChoiceItem()
    .setTitle('Are you 18 years or older?')
    .setHelpText('We can only include responses from adults.')
    .setRequired(true);

  // ─── Section 2: About you ────────────────────────────────────
  var pAbout = form.addPageBreakItem()
    .setTitle('A little about you')
    .setHelpText('Just broad groups — nothing that identifies you.');

  form.addMultipleChoiceItem()
    .setTitle('Your age group')
    .setChoiceValues(['18–21', '22–25', '26–30', '31–40', '41 or above'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('What do you currently do?')
    .setChoiceValues(['College / university student', 'Working', 'Homemaker', 'Looking for work', PREFER_NOT])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('Where do you live?')
    .setChoiceValues(['Big city (metro)', 'Smaller city', 'Town or village', PREFER_NOT])
    .showOtherOption(true);

  var trackHow = form.addMultipleChoiceItem()
    .setTitle('How do you usually keep track of your period?')
    .setHelpText('Pick the one you use most.')
    .setRequired(true);

  // ─── Section 3: App users ────────────────────────────────────
  var pAppUsers = form.addPageBreakItem()
    .setTitle('About the app you use')
    .setHelpText('Honest answers help the most — even "I hardly open it" is useful!');

  form.addCheckboxItem()
    .setTitle('Which app(s) do you use?')
    .setChoiceValues(['Flo', 'Clue', 'Maya', 'Stardust', "My phone's built-in health app", "I don't remember the name"])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('How long have you been using a period app?')
    .setChoiceValues(['Less than 6 months', '6 months – 1 year', '1–3 years', 'More than 3 years'])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('Why do you use it? (pick all that apply)')
    .setChoiceValues([
      'To know when my next period is coming',
      'To be prepared (pads, outfits, plans, travel)',
      'To track cramps, mood or other symptoms',
      'Because my periods are irregular',
      'To understand my body better',
      'To show my history to a doctor',
      'For fertility or ovulation',
      'Someone suggested it'
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('How often do you open it?')
    .setChoiceValues(['Almost every day', 'A few times a week', 'Only around my period', 'Rarely', 'I stopped using it'])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('How accurate are its predictions for you?')
    .setChoiceValues(['Almost always right', 'Off by a few days', 'Often wrong', "I don't check the predictions"])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('What annoys you about it? (pick all that apply)')
    .setChoiceValues([
      'Predictions are often wrong',
      'Too many ads',
      'Best features are behind a paywall',
      "I'm not sure who sees my data",
      'Logging takes too long',
      'Too focused on pregnancy / fertility',
      'Feels made for foreign users, not for me',
      'Notifications could be seen by others',
      'Hard to understand the charts or terms',
      "Doesn't help with pain or what to actually do",
      'Nothing — I like it'
    ])
    .showOtherOption(true);

  // ─── Section 4: Non-app users ────────────────────────────────
  var pNonUsers = form.addPageBreakItem()
    .setTitle('Not using an app? Totally fine!')
    .setHelpText('We would love to know why.');

  form.addCheckboxItem()
    .setTitle('Why not an app? (pick all that apply)')
    .setChoiceValues([
      "I don't feel I need one",
      'I worry about privacy / who sees my data',
      'Someone else might see it on my phone',
      'I tried one and did not like it',
      'I did not know such apps exist',
      'Not enough phone storage',
      'Good apps cost money'
    ])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('What would make you try one?')
    .setChoiceValues([
      'A hidden / locked mode nobody else can open',
      'Works without creating an account',
      'Available in Hindi or my language',
      'Completely free',
      'Recommended by a doctor',
      'Friends using it',
      'Nothing — I am happy as I am'
    ])
    .showOtherOption(true);

  // ─── Section 5: AI (everyone) ────────────────────────────────
  var pAI = form.addPageBreakItem()
    .setTitle('AI and your health 🤖')
    .setHelpText('Many people now ask AI chatbots about health. We are curious!');

  var aiUse = form.addMultipleChoiceItem()
    .setTitle('Have you ever asked an AI (like ChatGPT, Gemini or Meta AI) about periods or health?')
    .setRequired(true);

  // ─── Section 6: AI users ─────────────────────────────────────
  var pAIDetails = form.addPageBreakItem()
    .setTitle('Tell us about using AI for this');

  form.addCheckboxItem()
    .setTitle('Which AI do you use? (pick all that apply)')
    .setChoiceValues(['ChatGPT', 'Google Gemini', 'Meta AI (WhatsApp / Instagram)', 'AI inside my period app'])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('What do you usually ask it? (pick all that apply)')
    .setChoiceValues([
      'Is my period late or normal?',
      'How to reduce cramps or pain',
      'PCOS / PCOD questions',
      'Diet or exercise around my period',
      'Mood swings or feeling low',
      'Should I see a doctor?'
    ])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('What does AI NOT do well for this? (pick all that apply)')
    .setChoiceValues([
      'I have to type a long prompt explaining everything',
      'It forgets my history every time',
      "It doesn't know my actual cycle dates or symptoms",
      'Answers are too general, not about me',
      "I'm not sure the answers are correct or safe",
      'It feels awkward typing private things',
      'It just says "see a doctor"',
      'It works well — no complaints'
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('Would you like an AI in a period app that already knows your logs, so you can just tap a question?')
    .setChoiceValues(['Yes, definitely', 'Maybe', 'Only if my data stays private', 'No'])
    .showOtherOption(true);

  // ─── Section 7: Wishlist (everyone) ──────────────────────────
  var pWishlist = form.addPageBreakItem()
    .setTitle('Design your dream app ✨')
    .setHelpText('Tell us what matters to you.');

  form.addGridItem()
    .setTitle('How useful would these features be for you?')
    .setRows([
      'Next period prediction',
      'Reminders before my period',
      'Logging cramps, mood and flow in one tap',
      'Tips to ease cramps and pain',
      'Support for irregular periods / PCOS / PCOD',
      'Workout suggestions based on how I feel',
      'Calm-down exercises for mood swings',
      'A neat report to show my doctor',
      'App lock / hidden mode',
      'Hindi or regional language',
      'Works offline',
      'Anonymous community to ask questions'
    ])
    .setColumns(['Not needed', 'Nice to have', 'Must have']);

  form.addCheckboxItem()
    .setTitle('What would make you trust a health app with your data?')
    .setChoiceValues([
      'Data stays only on my phone',
      'No account or email needed',
      'A delete-everything button',
      'Clear, simple privacy promise',
      'Made by an Indian team',
      'No ads at all'
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('If an app had everything you want, what would you pay?')
    .setChoiceValues(['Only free', 'Up to ₹49 / month', '₹50–99 / month', 'A one-time payment', 'Not sure yet'])
    .showOtherOption(true);

  // ─── Section 8: Your experience (optional) ───────────────────
  form.addPageBreakItem()
    .setTitle('Your experience (all optional)')
    .setHelpText(
      'Lots of people deal with these things, so you are definitely not alone. 💗\n' +
      'Skip any question you like — nothing here is required.'
    );

  form.addMultipleChoiceItem()
    .setTitle('Do period cramps or discomfort affect your day (studies, work, plans)?')
    .setChoiceValues(['Never', 'Sometimes', 'Often', 'Almost every period', PREFER_NOT])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('Have you ever wanted more support with any of these?')
    .setHelpText('Pick any that apply.')
    .setChoiceValues([
      'Irregular or missed periods',
      'PCOS / PCOD',
      'Heavy flow',
      'Strong cramps',
      'Mood changes before periods',
      'Tiredness or low energy',
      'None of these',
      PREFER_NOT
    ])
    .showOtherOption(true);

  form.addCheckboxItem()
    .setTitle('Who do you usually talk to about period questions?')
    .setChoiceValues(['Mother or family', 'Friends', 'Doctor', 'Google / YouTube / Instagram', 'Partner', 'Nobody — I figure it out myself', PREFER_NOT])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('How comfortable are you visiting a gynecologist?')
    .setChoiceValues(['Comfortable', 'A bit hesitant', 'Very hesitant', 'Never been', PREFER_NOT])
    .showOtherOption(true);

  // ─── Section 9: Last words ───────────────────────────────────
  form.addPageBreakItem()
    .setTitle('Last one! 🎉');

  form.addMultipleChoiceItem()
    .setTitle('If a period app could do just ONE thing for you, what should it be?')
    .setChoiceValues([
      'Predict my period correctly, even if irregular',
      'Tell me what to do when pain hits',
      'Explain my body in simple words',
      'Help me talk to a doctor with a clear report',
      'Keep everything private and hidden'
    ])
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('Anything else you want to tell us?')
    .setHelpText('Please do not write your name or contact details here.')
    .setChoiceValues(['No, all good!', 'I would love to try the app when it is ready', 'Please make it free for students'])
    .showOtherOption(true);

  // ─── Branching (set after all pages exist) ───────────────────
  ageCheck.setChoices([
    ageCheck.createChoice('Yes', pAbout),
    ageCheck.createChoice('No', FormApp.PageNavigationType.SUBMIT)
  ]);

  trackHow.setChoices([
    trackHow.createChoice('A period tracker app', pAppUsers),
    trackHow.createChoice('Phone calendar or notes', pNonUsers),
    trackHow.createChoice('Paper calendar or diary', pNonUsers),
    trackHow.createChoice('I just remember it', pNonUsers),
    trackHow.createChoice("I don't really track it", pNonUsers),
    trackHow.createChoice('Something else', pNonUsers)
  ]);

  aiUse.setChoices([
    aiUse.createChoice('Yes, often', pAIDetails),
    aiUse.createChoice('Yes, a few times', pAIDetails),
    aiUse.createChoice('No, never', pWishlist),
    aiUse.createChoice("No, but I'd like to", pWishlist)
  ]);

  // After the app-users section, skip the non-users section and go to the AI question.
  pNonUsers.setGoToPage(pAI);

  // ─── Save responses to a Google Sheet ────────────────────────
  var sheet = SpreadsheetApp.create('SheSync Survey Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('✅ Form created!');
  Logger.log('Share this link:   ' + form.getPublishedUrl());
  Logger.log('Edit the form:     ' + form.getEditUrl());
  Logger.log('Responses sheet:   ' + sheet.getUrl());
}
