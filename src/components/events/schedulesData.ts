export type ScheduleItem = {
  timeEn: string;
  timeUr: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  filled: boolean;
};

export const schedulesData: Record<'waleema', {
  nameEn: string;
  nameUr: string;
  items: ScheduleItem[];
}> = {
  waleema: {
    nameEn: 'Waleema',
    nameUr: 'ولیمہ',
    items: [
      {
        timeEn: '06:30 PM',
        timeUr: 'شام ۶:۳۰',
        titleEn: 'Guest Arrival',
        titleUr: 'مہمانوں کی آمد',
        descEn: 'Warm welcome & greetings to all beloved guests',
        descUr: 'پیارے مہمانوں کا پرتپاک استقبال',
        filled: false,
      },
      {
        timeEn: '07:00 PM',
        timeUr: 'شام ۷:۰۰',
        titleEn: 'Reception',
        titleUr: 'استقبالیہ',
        descEn: 'An elegant gathering beneath the moon',
        descUr: 'چاندنی میں ایک پُروقار محفل',
        filled: true,
      },
      {
        timeEn: '08:00 PM',
        timeUr: 'رات ۸:۰۰',
        titleEn: 'Dinner',
        titleUr: 'ولیمہ کا کھانا',
        descEn: 'Grand feast in celebration of the newlyweds',
        descUr: 'نو بیاہتا جوڑے کی خوشی میں ضیافت',
        filled: false,
      },
      {
        timeEn: '09:00 – 10:00 PM',
        timeUr: 'رات ۹:۰۰ تا ۱۰:۰۰',
        titleEn: 'Celebration',
        titleUr: 'جشن',
        descEn: 'Capturing memories & joyful celebration',
        descUr: 'یادگار لمحات اور پرمسرت جشن',
        filled: false,
      },
    ],
  },
};
