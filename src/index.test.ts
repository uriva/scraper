import { assertEquals } from "assert";
import { pipe, sideEffect } from "gamla";
import {
  SimplifiedNode,
  filterPageParts,
  findInSimplifiedTree,
  mainList,
  simplifiedHtmlToString,
  simplifyHtml,
} from "./index.ts";

const writeToFile = <T>(obj: T) =>
  Deno.writeFileSync(
    "./output.json",
    new TextEncoder().encode(JSON.stringify(obj, null, 2)),
  );

const readText = (file: string) =>
  new TextDecoder().decode(Deno.readFileSync("./example-pages/" + file));

const simplifyFile = pipe(
  readText,
  simplifyHtml,
  sideEffect(writeToFile<SimplifiedNode>),
);

Deno.test("test runs without errors", () => {
  ["imdb1.html", "moviequotes.html", "facebook.html"].forEach(simplifyFile);
});

Deno.test("colon", () => {
  const value =
    "Cal Jacobs : I'm envious of your generation, you know. You guys don't care as much about the rules.";
  assertEquals(
    findInSimplifiedTree(
      (x: SimplifiedNode) => x.type === "primitive" && x.value === value,
    )(simplifyFile("imdb2.html")),
    { type: "primitive", value },
  );
});

Deno.test("imdb3", () => {
  const value =
    "Alejandro Jodorowsky : What is the goal of the life? It's to create yourself a soul. For me, movies are an art... more than an industry. And its the search of the human soul... as painting, as literature, as poetry. Movies are that for me.";
  assertEquals(
    findInSimplifiedTree((x) => x.type === "primitive" && x.value === value)(
      simplifyFile("imdb3.html"),
    ),
    { type: "primitive", value },
  );
});

Deno.test("headline understanding", () => {
  assertEquals(mainList(simplifyFile("tvfanatic.html")).children.length, 12);
});

Deno.test("stringify", () => {
  assertEquals(
    simplifiedHtmlToString(simplifyFile("facebook.html")),
    `SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE | Facebook


Facebook Log In Log In Forgot Account?
Events Home Categories Classics Comedy Crafts Dance Drinks Fitness & Workouts Foods Games Gardening Health & Medical Healthy Living & Self-Care Home & Garden Music & Audio Parties Professional Networking Religions Shopping Social Issues Sports Theater TV & Movies Visual Arts


6 THURSDAY, JUNE 6, 2024 AT 9:00 PM IDT SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE ‎גולדמונד ספרים יד-שניה‎ About Discussion More About Discussion SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE Invite
Details Event by Uri Schuster and Hanan Offner ‎גולדמונד ספרים יד-שניה‎ Public · Anyone on or off Facebook English Follows הזדמנות לחגוג חופשי עם סטים ארוכים שישאבו אותנו לעולמות הנכונים. מסיבה בסביבה מיוחדת עם תפאורה מושקעת, תאורה צבעונית והקרנות וידיאו: - רחבת ריקודים למי שרוצה לנסוק. - זולה בקומה למעלה למי שרוצה לנשור. - מרפסת אוורירית למי שרוצה לנשום. מדובר במקום מרווח יחסית ואתם מוזמנים להביא דאפו, חישוקים ודברים אחרים שעושים לכם טוב. אנחנו בכל מקרה מכינים כמה הפתעות משלנו הערכים שלנו הם שלום, אהבה, אחדות וכבוד, וזה מה שהמסיבה מבקשת לקדם עכשיו. זאת מסיבת כובע ואנחנו מארגנים אותה מכל הלב כדי שאנשים טובים יוכלו להפגש ולהנות. הכניסה חופשית, אבל נשמח אם תשימו כסף כי אנחנו עובדים עליה קשה וצריכים לכסות הוצאות. מתחילים מוקדם ומסיימים מוקדם, אז כדאי להגיע בזמן! ליינאפ: 21:00 - DJ Rochelle (AKA Hanan Offner) - Acid Trance, Old School Goa Trance. 23:15 - DJ Uri Schuster - New Goa, Full-on, Forest. https://www.mixcloud.com/.../seabed-dreams-first-set-goa.../ * לאורך כל המסיבה יהיה בזולה גם פלייליסט שבחרנו בקפידה עם פסייביינט, דאב ודיפ טראנס. מזכרת קטנה מהמסיבה הקודמת: https://www.youtube.com/watch?v=KIXPDdMVx3c הרשמה לעדכונים על מסיבות נוספות: https://forms.gle/k4hAyLoFQ3qrk5vF7 An opportunity to freely celebrate with elaborated sets that will draw us into the proper worlds. A party held in a unique environment with ornate scenery, colourful lighting and video screenings: - A party floor for anyone who wishes to fly. - An upstairs chilling space for anyone who wishes to lie. - An airy balcony for anyone who wishes to sigh. It is a relatively spacious place, so you can bring spinning toys, hula-hoops and other things that spark joy. We are preparing some nice surprises anyway Our values are peace, love, unity and respect, and this is the aim of this party. It is a hat party, and we arrange it lovingly because we want good people to be able to meet and enjoy themselves. Entrance is free, but please pay us since we are working hard and have expenses to cover. We start early and finish early, so you better arrive on time! Line-up: 21:00 - DJ Rochelle (AKA Hanan Offner) - Acid Trance, Old School Goa Trance. 23:15 - DJ Uri Schuster - New Goa, Full-on, Forest. https://www.mixcloud.com/.../seabed-dreams-first-set-goa.../ * We will also play a curated playlist with Psybient, Dub and Deep Trance in the chilling space throughout the evening. Here is a little memory from our last party: https://www.youtube.com/watch?v=KIXPDdMVx3c Subscribe to updates about forthcoming parties: https://forms.gle/k4hAyLoFQ3qrk5vF7 See less Haifa, Israel Hosts Uri Schuster Hanan Offner


גולדמונד ספרים יד-שניה ekron 6, Haifa חנות לספרים יד-שניה הממוקמת בסמוך לשוק תלפיות, חיפה. המקום מארח הופעות-חיות, הרצאות, מסיבות, סדנאות ו
Related events Tue, May 28 at 7:30 PM IDT Ури Гершович и Григорий Зельцер представляют: «Помолвка» Allenby 19, 63302 Tel Aviv, Israel Fri, Aug 2 at 4:00 PM IDT הודו בתל-אביב Tel Aviv תל אביב Thu, May 30 at 7:00 PM MSK "Магия Контакта". Пробные уроки курса контактной импровизации Бейт Альфа 13/15, 6721913 תל אביב - יפו, ישראל Tue, May 28 at 7:30 PM IDT "Ecstatic Journey: Ветер времени и земля чувств" с Александром Гиршоном в Тель-Авиве סמינר הקיבוצים Wed, May 29 at 9:00 AM IDT קולנוע הפסגה ביפו העתיקה ★ רוק בבית בספר ★ רביעי 29.5 ★ הכניסה חופשית! גן הפסגה יפו


Privacy ·
Terms ·
Advertising ·
Ad Choices ·
Cookies ·
Cookie Settings ·
More ·
Meta © 2024
Log in or sign up for Facebook to connect with friends, family and people you know. Log In or Create new account`,
  );
});

Deno.test("remove page parts", () => {
  assertEquals(
    pipe(
      simplifyFile,
      filterPageParts(
        (x: SimplifiedNode) =>
          x.type !== "primitive" || x.value !== "Related events",
      ),
      simplifiedHtmlToString,
    )("facebook.html"),
    `SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE | Facebook


Facebook Log In Log In Forgot Account?
Events Home Categories Classics Comedy Crafts Dance Drinks Fitness & Workouts Foods Games Gardening Health & Medical Healthy Living & Self-Care Home & Garden Music & Audio Parties Professional Networking Religions Shopping Social Issues Sports Theater TV & Movies Visual Arts


6 THURSDAY, JUNE 6, 2024 AT 9:00 PM IDT SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE ‎גולדמונד ספרים יד-שניה‎ About Discussion More About Discussion SEABED DREAMS | GOA TRANCE PARTY | FREE ENTRANCE Invite
Details Event by Uri Schuster and Hanan Offner ‎גולדמונד ספרים יד-שניה‎ Public · Anyone on or off Facebook English Follows הזדמנות לחגוג חופשי עם סטים ארוכים שישאבו אותנו לעולמות הנכונים. מסיבה בסביבה מיוחדת עם תפאורה מושקעת, תאורה צבעונית והקרנות וידיאו: - רחבת ריקודים למי שרוצה לנסוק. - זולה בקומה למעלה למי שרוצה לנשור. - מרפסת אוורירית למי שרוצה לנשום. מדובר במקום מרווח יחסית ואתם מוזמנים להביא דאפו, חישוקים ודברים אחרים שעושים לכם טוב. אנחנו בכל מקרה מכינים כמה הפתעות משלנו הערכים שלנו הם שלום, אהבה, אחדות וכבוד, וזה מה שהמסיבה מבקשת לקדם עכשיו. זאת מסיבת כובע ואנחנו מארגנים אותה מכל הלב כדי שאנשים טובים יוכלו להפגש ולהנות. הכניסה חופשית, אבל נשמח אם תשימו כסף כי אנחנו עובדים עליה קשה וצריכים לכסות הוצאות. מתחילים מוקדם ומסיימים מוקדם, אז כדאי להגיע בזמן! ליינאפ: 21:00 - DJ Rochelle (AKA Hanan Offner) - Acid Trance, Old School Goa Trance. 23:15 - DJ Uri Schuster - New Goa, Full-on, Forest. https://www.mixcloud.com/.../seabed-dreams-first-set-goa.../ * לאורך כל המסיבה יהיה בזולה גם פלייליסט שבחרנו בקפידה עם פסייביינט, דאב ודיפ טראנס. מזכרת קטנה מהמסיבה הקודמת: https://www.youtube.com/watch?v=KIXPDdMVx3c הרשמה לעדכונים על מסיבות נוספות: https://forms.gle/k4hAyLoFQ3qrk5vF7 An opportunity to freely celebrate with elaborated sets that will draw us into the proper worlds. A party held in a unique environment with ornate scenery, colourful lighting and video screenings: - A party floor for anyone who wishes to fly. - An upstairs chilling space for anyone who wishes to lie. - An airy balcony for anyone who wishes to sigh. It is a relatively spacious place, so you can bring spinning toys, hula-hoops and other things that spark joy. We are preparing some nice surprises anyway Our values are peace, love, unity and respect, and this is the aim of this party. It is a hat party, and we arrange it lovingly because we want good people to be able to meet and enjoy themselves. Entrance is free, but please pay us since we are working hard and have expenses to cover. We start early and finish early, so you better arrive on time! Line-up: 21:00 - DJ Rochelle (AKA Hanan Offner) - Acid Trance, Old School Goa Trance. 23:15 - DJ Uri Schuster - New Goa, Full-on, Forest. https://www.mixcloud.com/.../seabed-dreams-first-set-goa.../ * We will also play a curated playlist with Psybient, Dub and Deep Trance in the chilling space throughout the evening. Here is a little memory from our last party: https://www.youtube.com/watch?v=KIXPDdMVx3c Subscribe to updates about forthcoming parties: https://forms.gle/k4hAyLoFQ3qrk5vF7 See less Haifa, Israel Hosts Uri Schuster Hanan Offner


גולדמונד ספרים יד-שניה ekron 6, Haifa חנות לספרים יד-שניה הממוקמת בסמוך לשוק תלפיות, חיפה. המקום מארח הופעות-חיות, הרצאות, מסיבות, סדנאות ו
Related events Tue, May 28 at 7:30 PM IDT Ури Гершович и Григорий Зельцер представляют: «Помолвка» Allenby 19, 63302 Tel Aviv, Israel Fri, Aug 2 at 4:00 PM IDT הודו בתל-אביב Tel Aviv תל אביב Thu, May 30 at 7:00 PM MSK "Магия Контакта". Пробные уроки курса контактной импровизации Бейт Альфа 13/15, 6721913 תל אביב - יפו, ישראל Tue, May 28 at 7:30 PM IDT "Ecstatic Journey: Ветер времени и земля чувств" с Александром Гиршоном в Тель-Авиве סמינר הקיבוצים Wed, May 29 at 9:00 AM IDT קולנוע הפסגה ביפו העתיקה ★ רוק בבית בספר ★ רביעי 29.5 ★ הכניסה חופשית! גן הפסגה יפו


Privacy ·
Terms ·
Advertising ·
Ad Choices ·
Cookies ·
Cookie Settings ·
More ·
Meta © 2024
Log in or sign up for Facebook to connect with friends, family and people you know. Log In or Create new account`,
  );
});
