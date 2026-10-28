/**
 * Pages the AI writer may read and cite. Each one was checked by hand; add more the same way.
 * The writer can also read URLs given in a post's brief, but it can never cite a page it didn't read.
 */
export type LibrarySource = { id: string; label: string; url: string; covers: string };

export const SOURCE_LIBRARY: LibrarySource[] = [
  { id: "nhs-hair-loss", label: "NHS: Hair loss", url: "https://www.nhs.uk/conditions/hair-loss/", covers: "normal shedding, types of hair loss, when to see a GP, treatments on the NHS" },
  { id: "hse-hair-loss", label: "HSE: Hair loss", url: "https://www2.hse.ie/conditions/hair-loss/", covers: "hair loss in Ireland, when to see a GP, causes" },
  { id: "nhs-ringworm", label: "NHS: Ringworm", url: "https://www.nhs.uk/conditions/ringworm/", covers: "scalp ringworm (tinea capitis), symptoms, treatment, spread" },
  { id: "hse-ringworm", label: "HSE: Ringworm", url: "https://www2.hse.ie/conditions/ringworm/", covers: "ringworm in Ireland, scalp ringworm in children" },
  { id: "nhs-dandruff", label: "NHS: Dandruff", url: "https://www.nhs.uk/conditions/dandruff/", covers: "dandruff, flaky scalp, shampoos, when to see a GP" },
  { id: "nhs-psoriasis", label: "NHS: Psoriasis", url: "https://www.nhs.uk/conditions/psoriasis/", covers: "psoriasis including scalp psoriasis, triggers, treatment" },
  { id: "nhs-head-lice", label: "NHS: Head lice and nits", url: "https://www.nhs.uk/conditions/head-lice-and-nits/", covers: "head lice, detection combing, treatments" },
  { id: "nhs-contact-dermatitis", label: "NHS: Contact dermatitis", url: "https://www.nhs.uk/conditions/contact-dermatitis/", covers: "allergic and irritant reactions, including to hair dye" },
  { id: "nhs-hypothyroidism", label: "NHS: Underactive thyroid", url: "https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/", covers: "hypothyroidism symptoms including hair changes" },
  { id: "nhs-pcos", label: "NHS: Polycystic ovary syndrome", url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/", covers: "PCOS symptoms including thinning hair and excess hair growth" },
  { id: "nhs-iron", label: "NHS: Iron deficiency anaemia", url: "https://www.nhs.uk/conditions/iron-deficiency-anaemia/", covers: "iron deficiency symptoms, tests, hair loss" },
  { id: "dermnet-hair-loss", label: "DermNet: Hair loss", url: "https://dermnetnz.org/topics/hair-loss", covers: "overview and classification of hair loss" },
  { id: "dermnet-te", label: "DermNet: Telogen effluvium", url: "https://dermnetnz.org/topics/telogen-effluvium", covers: "shedding after illness, childbirth or stress, timing and recovery" },
  { id: "dermnet-aa", label: "DermNet: Alopecia areata", url: "https://dermnetnz.org/topics/alopecia-areata", covers: "patchy hair loss, signs, treatment, prognosis" },
  { id: "dermnet-fphl", label: "DermNet: Female pattern hair loss", url: "https://dermnetnz.org/topics/female-pattern-hair-loss", covers: "female pattern hair loss, miniaturisation, treatment" },
  { id: "dermnet-mphl", label: "DermNet: Male pattern hair loss", url: "https://dermnetnz.org/topics/male-pattern-hair-loss", covers: "male pattern hair loss, androgens, treatment" },
  { id: "dermnet-traction", label: "DermNet: Traction alopecia", url: "https://dermnetnz.org/topics/traction-alopecia", covers: "hair loss from tight styles, prevention, scarring risk" },
  { id: "dermnet-ffa", label: "DermNet: Frontal fibrosing alopecia", url: "https://dermnetnz.org/topics/frontal-fibrosing-alopecia", covers: "receding frontal hairline with scarring, eyebrow loss" },
  { id: "dermnet-lpp", label: "DermNet: Lichen planopilaris", url: "https://dermnetnz.org/topics/lichen-planopilaris", covers: "scarring hair loss with redness and scale around follicles" },
  { id: "dermnet-ccca", label: "DermNet: Central centrifugal cicatricial alopecia", url: "https://dermnetnz.org/topics/central-centrifugal-cicatricial-alopecia", covers: "scarring hair loss at the crown, more common in women of African descent" },
  { id: "dermnet-tinea", label: "DermNet: Tinea capitis", url: "https://dermnetnz.org/topics/tinea-capitis", covers: "fungal scalp infection, signs, treatment" },
  { id: "dermnet-sd", label: "DermNet: Seborrhoeic dermatitis", url: "https://dermnetnz.org/topics/seborrhoeic-dermatitis", covers: "seborrhoeic dermatitis and dandruff, Malassezia, treatment" },
  { id: "dermnet-scalp-psoriasis", label: "DermNet: Scalp psoriasis", url: "https://dermnetnz.org/topics/scalp-psoriasis", covers: "scalp psoriasis signs, difference from seborrhoeic dermatitis, treatment" },
  { id: "dermnet-folliculitis", label: "DermNet: Folliculitis", url: "https://dermnetnz.org/topics/folliculitis", covers: "inflamed hair follicles, causes, treatment" },
  { id: "dermnet-trichotillomania", label: "DermNet: Trichotillomania", url: "https://dermnetnz.org/topics/trichotillomania", covers: "hair pulling, signs, support" },
  { id: "dermnet-ppd", label: "DermNet: Allergy to paraphenylenediamine", url: "https://dermnetnz.org/topics/allergy-to-paraphenylenediamine", covers: "hair dye allergy (PPD), patch testing, reactions" },
  { id: "dermnet-trichoscopy", label: "DermNet: Trichoscopy", url: "https://dermnetnz.org/topics/trichoscopy", covers: "dermoscopy of hair and scalp, findings by condition" },
  { id: "bad-aa", label: "British Association of Dermatologists: Alopecia areata", url: "https://www.bad.org.uk/pils/alopecia-areata/", covers: "patient information on alopecia areata from UK dermatologists" },
  { id: "alopecia-uk", label: "Alopecia UK", url: "https://www.alopecia.org.uk/", covers: "UK charity support for people with alopecia" },
  { id: "iot", label: "Institute of Trichologists", url: "https://instituteoftrichologists.co.uk/", covers: "trichology training, Level 5 course, accredited register" },
  { id: "psa", label: "Professional Standards Authority", url: "https://www.psa.org.uk/", covers: "accredited registers for health and care practitioners in the UK" },
  { id: "ico-special-category", label: "ICO: Special category data", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/", covers: "health data under UK GDPR, client records and photos" },
  { id: "dpc", label: "Data Protection Commission (Ireland)", url: "https://www.dataprotection.ie/", covers: "data protection law in Ireland" },
];
