export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * The common questions the home page and every course/mentorship page answer.
 * Keep these grounded only in facts stated in the brief (beginner level, live
 * online format, invoice payment, a computer being the only requirement) —
 * never add claims (recordings, guarantees, discounts) that aren't in content.
 */
export function buildFaqItems(): FaqItem[] {
  return [
    {
      question: 'საჭიროა წინასწარი გამოცდილება?',
      answer: 'არა, კურსები განკუთვნილია სრულიად დამწყებთათვის და წინასწარი ცოდნა არ გჭირდებათ.',
    },
    {
      question: 'როგორ მიმდინარეობს სწავლება?',
      answer: 'სწავლება მთლიანად ონლაინ ფორმატშია, ლაივ ლექციების სახით.',
    },
    {
      question: 'როგორ ხდება გადახდა?',
      answer:
        'გადახდა ხდება ინვოისით, საბანკო გადარიცხვით. დარეგისტრირების შემდეგ დაგიკავშირდებით და გამოგიწერთ ინვოისს.',
    },
    {
      question: 'რა არის საჭირო კურსის გასავლელად?',
      answer: 'საჭირო იქნება მხოლოდ კომპიუტერი და სტაბილური ინტერნეტ კავშირი.',
    },
  ];
}
