export type EventId='waleema';
export type WeddingEvent={id:EventId;name:string;subtitle:string;date:string;day:string;time:string;venue:string;address:string;dressCode:string;message:string;mapUrl:string;calendarDescription:string};
export const wedding={
 couple:{groom:'Zurain',bride:'Abeeha',initials:'ZA'},families:["Zurain's Family","Abeeha's Family"],monthYear:'January 2027',countdownTarget:'2027-01-14T18:30:00+05:00',
 invitation:{
  arabic:'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم',
  translation:'In the name of Allah, the Most Gracious, the Most Merciful',
  greeting:'Assalam-o-Alaikum',
  wording:'Request the pleasure of your company at their Waleema reception.',
  dua:'May Allah bless this union with tranquillity, affection, mercy and a lifetime of companionship.',
  verseArabic:'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
  // Sahih International-aligned meaning of Al-Furqan 25:74
  verseMeaningEn:'Our Lord, grant us from among our spouses and offspring comfort to our eyes, and make us an example for the righteous.',
  verseMeaningUr:'اے ہمارے رب! ہمیں ہماری بیویوں اور اولاد کی طرف سے آنکھوں کی ٹھنڈک عطا فرما، اور ہمیں پرہیزگاروں کا امام بنا دے۔',
  verseReferenceEn:'Surah Al-Furqan · 25:74',
  verseReferenceUr:'سورۃ الفرقان · ۲۵:۷۴',
 },
 events:[
  {id:'waleema',name:'Waleema',subtitle:'The Moonlit Celebration',date:'2027-01-14',day:'Thursday',time:'7:00 – 10:00 PM',venue:'Viceroy',address:'',dressCode:'Elegant & Modest',message:'A graceful evening beneath the moon, shared with those we cherish.',mapUrl:'https://www.google.com/maps/search/?api=1&query=Viceroy+by+Mughaleazam+Lahore',calendarDescription:'Zurain and Abeeha — Waleema reception'}
 ] satisfies WeddingEvent[],story:[],gallery:[],
 whatsapp:{contactNumber:'923333409401',shareMessage:"You are warmly invited to Zurain and Abeeha's Waleema reception in Lahore — Thursday, 14 January 2027."},
 rsvp:{deadline:'2026-12-20',maxGuests:8},musicPath:'/audio/chaap-tilak.m4a',social:{title:'Waleema Reception — Zurain & Abeeha',description:'Save the date for our Waleema. Lahore · 14 January 2027.',image:'/social-preview.svg',themeColor:'#F7F1E8'},
 sections:{story:false,gallery:false,rsvp:true}
} as const;
