/* Station Rotation: other FCC CHEM 3A professors' lab lists, read from their PUBLIC syllabi
   in FCC's Simple Syllabus library. Used by index.html (?prof= / ?sec= links and the lab picker)
   and by setup.html (the "Set up for my class" page).

   Refresh each semester:  python3 tools/update_classes.py   (run on your own computer;
   Simple Syllabus blocks cloud servers), or ask Claude to re-read Simple Syllabus in your browser.
   Dr. Dan's own sections are hand-checked in SECTIONS inside index.html, so they are not here.
   Lab ids the game doesn't have yet (inGame 0 below) are kept so the game can say they're missing. */
window.SR_CLASSES = {
  updated: '2026-11-11',
  source: 'https://fresnocitycollege.simplesyllabus.com/en-US/syllabus-library',
  profs: [
    { key: 'uvarov', name: 'Professor Uvarov', term: 'Fall 2026', sections: ['25790', '25791', '25814', '25815'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/vobbuh6jt',
      labs: ['0a', '1a', '2a', '4a', '4b', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12b'] },
    { key: 'vellandi', name: 'Professor Vellandi', term: 'Fall 2026', sections: ['25807', '25808', '25809', '25816', '25817'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/xikb1c1yn',
      labs: ['1a', '2a', '4a', '5a', '7a', '8a', '9a', '10a', '11a', '12b'] },
    { key: 'yates', name: 'Professor Yates', term: 'Fall 2026', sections: ['29773'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/05ge543wf',
      labs: ['1a', '4a', '4b', '5a', '6a', '7a', '9a', '10a', '11a', '12a', '12b'] },
    { key: 'gilley', name: 'Professor Gilley', term: 'Spring 2026', sections: ['19263', '19264', '19265', '19266'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/422zvnkd6',
      labs: ['0a', '1a', '2a', '3a', '4a', '4b', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12a'] },
    { key: 'halloran', name: 'Professor Halloran', term: 'Spring 2026', sections: ['19320', '19321'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/2az8jbk4x',
      labs: ['0a', '1a', '2a', '4a', '4b', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12b'] },
    { key: 'mushibe', name: 'Professor Mushibe', term: 'Fall 2025', sections: ['43899', '43976'],
      syllabus: 'https://fresnocitycollege.simplesyllabus.com/en-US/doc/ynxoue7yh',
      labs: ['1a', '3a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12a'] }
  ]
};

/* Professors added by hand (no public syllabus to read). tools/update_classes.py leaves this list alone.
   labs: [] means they check their own labs on setup.html. */
window.SR_EXTRA_PROFS = [
  { key: 'lacey', name: 'Professor Lacey', term: '', sections: [], syllabus: '', labs: [] }
];
(function () { var c = window.SR_CLASSES, have = {}; c.profs.forEach(function (p) { have[p.key] = 1; });
  (window.SR_EXTRA_PROFS || []).forEach(function (p) { if (!have[p.key]) c.profs.push(p); }); })();

/* Every lab in the CHEM 3A Lab Manual (old and current). inGame: 0 = no practice questions yet.
   Keep in step with LABS in index.html. */
window.SR_LAB_NAMES = [
  ['0a', 'Lab Exploration', 1], ['1a', 'Making Measurements', 1], ['2a', 'Atomic Mass', 1],
  ['3a', 'Electrons in Atoms', 1], ['3z', 'Found or Forgery', 1], ['4a', 'Law of Constant Composition', 1],
  ['4b', 'Rolling for Compound Initiative', 1], ['5a', 'Empirical Formula', 1], ['6a', 'Molecular Modeling', 1],
  ['7a', 'Calorimetry', 1], ['8a', 'Gas Constant R', 1], ['9a', 'Solutions and Dilutions', 1],
  ['10a', 'Types of Reactions', 1], ['11a', 'Synthesis of Alum', 1], ['12a', 'pH of Household Items', 1],
  ['12b', 'Citric Acid in Soda', 1]
];
