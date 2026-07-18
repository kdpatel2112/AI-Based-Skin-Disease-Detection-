import copy

# Dictionary containing English-to-Hindi and English-to-Gujarati translations
EN_TO_HI = {
    # Static Lists / General Recommendations
    "Aim for 7-9 hours of sleep nightly to support skin repair.": "त्वचा के स्वास्थ्य के लिए रात में 7-9 घंटे की नींद लें।",
    "Practice stress management (breathing exercises, yoga, walking).": "तनाव प्रबंधन का अभ्यास करें (सांस लेने के व्यायाम, योग, टहलना)।",
    "Engage in regular moderate exercise; shower promptly afterward.": "नियमित मध्यम व्यायाम करें; उसके तुरंत बाद स्नान करें।",
    "Limit smoking and alcohol, which can worsen many skin conditions.": "धूम्रपान और शराब को सीमित करें, जो त्वचा की स्थिति को खराब कर सकते हैं।",
    "Foods rich in omega-3s (walnuts, flaxseed, fish)": "ओमेगा-3 से भरपूर खाद्य पदार्थ (अखरोट, अलसी के बीज, मछली)",
    "Antioxidant-rich fruits and vegetables": "एंटीऑक्सीडेंट से भरपूर फल और सब्जियां",
    "Probiotic foods (yogurt, fermented foods)": "प्रोबायोटिक खाद्य पदार्थ (दही, किण्वित खाद्य पदार्थ)",
    "Adequate water intake (~2-3 liters/day, individual needs vary)": "पर्याप्त मात्रा में पानी पीएं (~2-3 लीटर/दिन, व्यक्तिगत आवश्यकताएं भिन्न हो सकती हैं)",
    "Refined sugars and high-glycemic index foods": "रिफाइंड शुगर और उच्च ग्लाइसेमिक इंडेक्स वाले खाद्य पदार्थ",
    "Excessive dairy products if you notice a personal flare correlation": "यदि आप व्यक्तिगत रूप से समस्या बढ़ते हुए देखें तो डेयरी उत्पादों का अत्यधिक सेवन बंद करें",
    "Highly processed and fried foods": "अत्यधिक प्रसंस्कृत और तला हुआ भोजन",
    "Limit hot and spicy foods to prevent facial flushing.": "चेहरे की लालिमा को रोकने के लिए गर्म और मसालेदार भोजन को सीमित करें।",
    "Maintain steady hydration throughout the day; pair with a fragrance-free moisturizer suited to your skin type.": "दिन भर खुद को हाइड्रेटेड रखें; अपनी त्वचा के प्रकार के अनुकूल खुशबू रहित मॉइस्चराइज़र लगाएं।",
    
    # Severity Guidance
    "Mild presentation: home care and over-the-counter measures are typically a reasonable first step. Monitor for changes.": "हल्की स्थिति: घरेलू देखभाल और काउंटर पर मिलने वाले उपाय आमतौर पर एक उचित पहला कदम है। बदलावों की निगरानी करें।",
    "Moderate presentation: a consultation with a dermatologist is recommended to confirm diagnosis and discuss treatment options.": "मध्यम स्थिति: निदान की पुष्टि करने और उपचार के विकल्पों पर चर्चा करने के लिए त्वचा रोग विशेषज्ञ से परामर्श करने की सिफारिश की जाती है।",
    "Severe / high-risk presentation: please seek dermatologist or emergency care promptly — do not delay professional evaluation.": "गंभीर / उच्च जोखिम वाली स्थिति: कृपया तुरंत त्वचा रोग विशेषज्ञ या आपातकालीन देखभाल लें - पेशेवर मूल्यांकन में देरी न करें।",

    # Eczema
    "Apply a thick, fragrance-free moisturizer twice daily": "दिन में दो बार एक गाढ़ा, खुशबू रहित मॉइस्चराइज़र लगाएं",
    "Take short, lukewarm baths or showers": "कम समय के लिए गुनगुने पानी से स्नान करें",
    "Use gentle, soap-free cleansers": "सौम्य, साबुन रहित क्लींजर का प्रयोग करें",
    "Symptoms do not improve with OTC creams": "बिना पर्चे वाली क्रीम से लक्षणों में सुधार नहीं होता",
    "Skin is extremely painful or starts oozing yellow fluid": "त्वचा में अत्यधिक दर्द हो रहा है या पीला तरल पदार्थ निकलना शुरू हो गया है",
    "Itching disrupts sleep": "खुजली के कारण नींद नहीं आती",
    "Fever with rapid spreading redness, warmth, or red streaks (secondary cellulitis)": "तेजी से फैलती लालिमा, गर्मी, या लाल धारियों के साथ बुखार (माध्यमिक सेल्युलाइटिस)",
    "Topical Emollients": "मलहम (Topical Emollients)",
    "Mild Topical Steroids (prescribed)": "हल्के स्टेरॉयड क्रीम (चिकित्सक द्वारा अनुशंसित)",
    "Oral Antihistamines (for itching)": "एंटीहिस्टामाइन गोलियां (खुजली के लिए)",
    "Restore skin barrier hydration and reduce local inflammation and itching.": "त्वचा की नमी को बहाल करना और सूजन तथा खुजली को कम करना।",
    "Avoid continuous steroid use without supervision": "बिना चिकित्सकीय देखरेख के लगातार स्टेरॉयड के उपयोग से बचें",
    "Do not apply steroids on broken/infected skin": "कटी हुई या संक्रमित त्वचा पर स्टेरॉयड न लगाएं",
    "Skin thinning with prolonged steroid use": "लंबे समय तक स्टेरॉयड के उपयोग से त्वचा का पतला होना",
    "Drowsiness from certain antihistamines": "कुछ एंटीहिस्टामाइन दवाओं से उनींदापन होना",
    "Discontinue use if skin irritation or rash worsens after application.": "यदि लगाने के बाद त्वचा में जलन या दाने बिगड़ जाते हैं, तो उपयोग बंद कर दें।",

    # Warts
    "Keep growths clean and dry": "गांठों को साफ और सूखा रखें",
    "Use OTC salicylic acid treatments for warts (avoid on face)": "मस्सों के लिए बिना पर्चे वाली सैलिसिलिक एसिड दवाओं का प्रयोग करें (चेहरे पर लगाने से बचें)",
    "Cover warts with a bandage to prevent spreading": "फैलने से रोकने के लिए मस्सों को पट्टी से ढकें",
    "Growths are painful, bleeding, or changing color": "गांठों में दर्द, रक्तस्राव या रंग में बदलाव हो रहा है",
    "Growths appear on the face or genitals": "गांठें चेहरे या जननांगों पर दिखाई देती हैं",
    "Multiple new lesions appear rapidly": "कई नए घाव तेजी से दिखाई देते हैं",
    "Severe spreading infection or redness around a lesion accompanied by high fever": "घाव के आसपास तेज बुखार के साथ गंभीर रूप से फैलने वाला संक्रमण या लालिमा",
    "Salicylic acid preparations": "सैलिसिलिक एसिड की दवाएं",
    "Cryotherapy agents (OTC/professional)": "क्रायोथेरेपी एजेंट (फ्रीजिंग उपचार)",
    "Immune response modifiers (e.g. imiquimod)": "इम्यून रिस्पॉन्स मॉडिफायर्स (जैसे इमीकिमॉड)",
    "Destructive peeling of viral-infected tissue or stimulating local immune response.": "वायरस-संक्रमित ऊतकों को निकालना या स्थानीय प्रतिरक्षा प्रणाली को उत्तेजित करना।",
    "Avoid contact with eyes, face, or genitals unless specified": "जब तक विशेष रूप से न कहा जाए, आंखों, चेहरे या जननांगों के संपर्क से बचें",
    "Do not use on bleeding or irritated skin": "रक्तस्राव या चिढ़चिढ़ी त्वचा पर इसका प्रयोग न करें",
    "Skin redness": "त्वचा की लालिमा",
    "Localized burning": "लगाने की जगह पर जलन",
    "Peeling or blistering": "त्वचा का निकलना या छाले पड़ना",
    "Seek medical attention if severe chemical burning, hives, or breathing issues occur.": "यदि गंभीर रासायनिक जलन, पित्ती, या सांस लेने में तकलीफ हो, तो तुरंत चिकित्सा सहायता लें।",

    # Melanoma
    "Professional medical evaluation and surgical excision are required immediately. Self-care alone is unsafe.": "तुरंत पेशेवर चिकित्सा मूल्यांकन और सर्जरी की आवश्यकता है। केवल स्व-देखभाल असुरक्षित है।",
    "Any mole that matches the ABCDE criteria (Asymmetry, Border, Color, Diameter, Evolving)": "कोई भी तिल जो ABCDE मानदंडों (असममित, अनियमित सीमा, रंग बदलना, 6 मिमी से बड़ा) से मेल खाता हो",
    "A new pigmented growth on previously clear skin": "पहले साफ त्वचा पर एक नया रंगीन दाग या गांठ",
    "Rapidly growing, bleeding, or ulcerated dark lesion - seek urgent dermatology evaluation immediately.": "तेजी से बढ़ता हुआ, खून बहता हुआ, या घावयुक्त काला दाग - तुरंत आपातकालीन त्वचा रोग विशेषज्ञ से संपर्क करें।",
    "Surgical excision (primary)": "सर्जिकल निष्कासन (मुख्य इलाज)",
    "Immunotherapy": "इम्यूनोथेरेपी (प्रतिरक्षा प्रणाली उपचार)",
    "Targeted therapy": "लक्षित थेरेपी (Targeted Therapy)",
    "Chemotherapy / Radiation": "कीमोथेरेपी / विकिरण चिकित्सा (Radiation)",
    "Specialist oncology and dermatology treatments. Self-medication is not appropriate.": "कैंसर विशेषज्ञ और त्वचा विशेषज्ञ द्वारा उपचार। स्व-दवा बिल्कुल भी उपयुक्त नहीं है।",
    "This is a high-risk malignancy; urgent surgical oncology staging is required": "यह एक उच्च जोखिम वाला कैंसर है; तत्काल सर्जिकल ऑन्कोलॉजी की आवश्यकता है",
    "Do not attempt self-treatment": "स्वयं इलाज करने का प्रयास न करें",
    "Varies widely depending on the prescribed clinical systemic therapy": "निर्धारित क्लिनिकल सिस्टेमिक थेरेपी के आधार पर काफी भिन्न होता है",
    "Not applicable — professional oncological intervention is required.": "लागू नहीं - पेशेवर कैंसर विशेषज्ञ के हस्तक्षेप की आवश्यकता है।",

    # Atopic Dermatitis
    "Moisturize multiple times daily": "दिन में कई बार मॉइस्चराइज़ करें",
    "Keep fingernails short to prevent scratching damage": "खुजली से त्वचा को नुकसान से बचाने के लिए नाखूनों को छोटा रखें",
    "Wear soft, breathable cotton clothing": "मुलायम, सांस लेने योग्य सूती कपड़े पहनें",
    "Itching interferes with sleep or daily activities": "खुजली नींद या दैनिक गतिविधियों में बाधा डालती है",
    "Signs of infection like yellow crusts, pus, or oozing": "संक्रमण के लक्षण जैसे पीली पपड़ी, मवाद या बहना",
    "Worsen despite regular moisturizing": "नियमित मॉइस्चराइजिंग के बावजूद स्थिति का बिगड़ना",
    "Widespread painful blisters, skin peeling, and high fever (possible eczema herpeticum)": "व्यापक दर्दनाक छाले, त्वचा का निकलना और तेज बुखार (संभावित एक्जिमा हर्पेटिकम)",
    "Thick Emollients/Ceramide creams": "गाढ़े मॉइस्चराइज़र/सिरेमाइड क्रीम",
    "Topical Corticosteroids": "कॉर्टिकोस्टेरॉइड क्रीम (Topical Corticosteroids)",
    "Calcineurin inhibitors (tacrolimus)": "कैल्सीनुरिन इनहिबिटर (टैक्रोलिमस)",
    "JAK inhibitors": "जेएके इनहिबिटर (JAK inhibitors)",
    "Repair the genetic skin barrier defect and control chronic immune-mediated flares.": "आनुवंशिक त्वचा बाधा दोष को ठीक करना और पुरानी सूजन को नियंत्रित करना।",
    "Use steroid creams sparingly on thin-skin areas (face, folds)": "पतली त्वचा वाले क्षेत्रों (चेहरे, सिलवटों) पर स्टेरॉयड क्रीम का कम से कम उपयोग करें",
    "Apply moisturizer first": "पहले मॉइस्चराइज़र लगाएं",
    "Temporary burning/stinging at application site": "लगाने वाली जगह पर अस्थायी जलन या चुभन",
    "Increased risk of localized skin infections": "स्थानीय त्वचा संक्रमण का बढ़ा हुआ खतरा",
    "Discontinue and consult your doctor if signs of bacterial skin infection (yellow crusts) occur.": "बैक्टीरिया त्वचा संक्रमण (पीली पपड़ी) के लक्षण दिखने पर उपयोग बंद करें और डॉक्टर से सलाह लें।",

    # Basal Cell
    "Requires professional dermatologist diagnosis and surgical excision or treatment. Self-treatment is not possible.": "पेशेवर त्वचा रोग विशेषज्ञ द्वारा निदान और सर्जरी की आवश्यकता है। स्वयं इलाज संभव नहीं है।",
    "Any skin sore or growth that fails to heal within three to four weeks": "त्वचा का कोई भी घाव या गांठ जो तीन से चार सप्ताह के भीतर ठीक न हो",
    "A pearly bump that slowly enlarges": "एक मोती जैसा दाना जो धीरे-धीरे बड़ा हो रहा हो",
    "Rapid bleeding or infected skin growth causing localized swelling and fever": "तेजी से खून बहना या संक्रमित त्वचा का बढ़ना जिसके कारण स्थानीय सूजन और बुखार हो",
    "Surgical excision": "सर्जिकल निष्कासन (Surgical Excision)",
    "Mohs micrographic surgery": "मोह्स माइक्रोग्राफिक सर्जरी",
    "Topical chemotherapy (imiquimod)": "सामयिक कीमोथेरेपी (इमीकिमॉड)",
    "Photodynamic therapy": "फोटोडायनामिक थेरेपी",
    "Eliminate cancerous epidermal basal cells and prevent local tissue damage.": "कैंसरयुक्त एपिडर्मल बेसल कोशिकाओं को नष्ट करना और स्थानीय ऊतकों को नुकसान से बचाना।",
    "Requires professional diagnosis and removal; home remedies are ineffective and unsafe": "पेशेवर निदान और हटाने की आवश्यकता है; घरेलू उपचार अप्रभावी और असुरक्षित हैं",
    "Localized swelling": "स्थानीय सूजन",
    "Redness": "लालिमा",
    "Scarring at the surgical site": "सर्जरी वाली जगह पर निशान पड़ना",
    "Not applicable — requires professional in-clinic treatment.": "लागू नहीं - अस्पताल में पेशेवर इलाज की आवश्यकता है।",

    # Moles
    "Perform monthly checks to monitor for changes in size, shape, color, or symmetry.": "आकार, रूप, रंग या समरूपता में बदलाव की निगरानी के लिए मासिक जांच करें।",
    "A mole becomes asymmetrical, develops irregular borders, exhibits multiple colors, grows larger than 6mm, or starts bleeding/itching": "एक तिल असममित हो जाता है, अनियमित सीमाएं विकसित करता है, कई रंग दिखाता है, 6 मिमी से बड़ा हो जाता है, या खून बहना/खुजली शुरू हो जाती है",
    "Professional shave removal": "पेशेवर शेव रिमूवल",
    "Surgical excision (with biopsy)": "सर्जिकल उच्छेदन (बायोप्सी के साथ)",
    "Removal of moles if they are irritated by clothing, cosmetically bothersome, or suspicious.": "कपड़ों से रगड़ खाने वाले, कॉस्मेटिक रूप से परेशान करने वाले, या संदिग्ध तिलों को हटाना।",
    "Moles must be removed by a doctor to allow laboratory biopsy": "लैबोरेटरी बायोप्सी के लिए डॉक्टरों द्वारा तिलों को हटाना आवश्यक है",
    "Never attempt to cut or freeze a mole at home": "घर पर कभी भी तिल को काटने या फ्रीज करने का प्रयास न करें",
    "Mild surgical scarring": "हल्का निशान",
    "Temporary localized pain": "अस्थायी स्थानीय दर्द",
    "Seek professional dermatological review if a mole changes.": "यदि कोई तिल बदलता है, तो पेशेवर त्वचा विशेषज्ञ की सलाह लें।",

    # Benign Keratosis
    "Keep skin moisturized. Avoid picking or scratching the growths, which can cause bleeding or infection.": "त्वचा को नम रखें। गांठों को नोचने या खुजलाने से बचें, जिससे रक्तस्राव या संक्रमण हो सकता है।",
    "Growths grow rapidly, bleed, or become inflamed": "गांठें तेजी से बढ़ती हैं, खून बहता है, या सूजन आ जाती है",
    "A growth looks dark, irregular, or has multiple colors (to rule out melanoma)": "एक गांठ काली, अनियमित दिखती है या उसमें कई रंग हैं (मेलानोमा से इनकार करने के लिए)",
    "Cryotherapy (freezing)": "क्रायोथेरेपी (फ्रीजिंग)",
    "Electrocautery / Shave removal": "इलेक्ट्रोकॉटरी / शेव निष्कासन",
    "Laser therapy": "लेजर थेरेपी",
    "Safe removal of cosmetic or physically irritated benign keratosis-like lesions.": "कॉस्मेटिक या शारीरिक रूप से परेशान करने वाले सौम्य केराटोसिस जैसे घावों को सुरक्षित रूप से हटाना।",
    "Confirm with a dermatologist that the lesion is benign before removal": "हटाने से पहले त्वचा रोग विशेषज्ञ से पुष्टि करें कि घाव सौम्य (Benign) है",
    "Avoid scratching or peeling": "खुजलाने या छीलने से बचें",
    "Hypopigmentation (lighter skin patch)": "हाइपोपिग्मेंटेशन (हल्का त्वचा का धब्बा)",
    "Temporary blistering": "अस्थायी छाले",
    "Consult a doctor if the spot starts growing rapidly or bleeding.": "यदि दाग तेजी से बढ़ने लगे या खून बहने लगे तो डॉक्टर से सलाह लें।",

    # Psoriasis
    "Moisturize daily with heavy creams": "भारी क्रीम के साथ रोजाना मॉइस्चराइज करें",
    "Take warm baths with Epsom salts or oatmeal": "एप्सम सॉल्ट या दलिया के साथ गुनगुने पानी से स्नान करें",
    "Limit alcohol intake": "शराब का सेवन सीमित करें",
    "Joint pain, stiffness, or swelling (indicative of psoriatic arthritis)": "जोड़ों का दर्द, अकड़न, या सूजन (सोरियाटिक गठिया का संकेत)",
    "Widespread rash covering more than 10% of the body": "शरीर के 10% से अधिक हिस्से को कवर करने वाले व्यापक दाने",
    "Plaques cause severe pain or bleed easily": "चकत्ते अत्यधिक दर्द का कारण बनते हैं या आसानी से खून बहने लगता है",
    "Widespread redness and peeling skin over the entire body accompanied by chills and high fever (possible erythrodermic psoriasis)": "कंपकंपी और तेज बुखार के साथ पूरे शरीर पर व्यापक लाली और त्वचा का निकलना (संभावित एरिथ्रोडर्मिक सोरायसिस)",
    "High-potency Topical Corticosteroids": "उच्च क्षमता वाली कॉर्टिकोस्टेरॉइड क्रीम",
    "Coal tar formulations": "कोल टार फॉर्मूलेशन (Coal tar)",
    "Vitamin D3 analogues": "विटामिन डी3 एनालॉग्स",
    "Systemic Biologics": "सिस्टेमिक बायोलॉजिक्स (इंजेक्शन/दवाएं)",
    "Slow down rapid skin cell production (Psoriasis) and reduce autoimmune-driven skin inflammation.": "तेजी से त्वचा कोशिका उत्पादन (सोरायसिस) को धीमा करना और त्वचा की सूजन को कम करना।",
    "Do not stop oral/systemic medications suddenly": "अचानक मौखिक/प्रणालीगत दवाएं बंद न करें",
    "Avoid skin injury which can trigger new plaques": "त्वचा की चोट से बचें जो नए पैच को ट्रिगर कर सकती है",
    "Systemic immunosuppression (with biologic agents)": "प्रणालीगत इम्यूनोसप्रेशन (जैविक एजेंटों के साथ)",
    "Seek immediate medical attention if you experience severe joint pain, widespread skin redness, or fever.": "यदि आपको जोड़ों में गंभीर दर्द, व्यापक लाली या बुखार का अनुभव हो, तो तुरंत डॉक्टर से संपर्क करें।",

    # Seborrheic
    "Avoid scratching or picking at the lesions, which can lead to bleeding, pain, and secondary infection.": "घावों को नोचने या खुजलाने से बचें, जिससे रक्तस्राव, दर्द और अन्य संक्रमण हो सकते हैं।",
    "A growth changes rapidly, bleeds, or becomes highly irritated": "गांठ तेजी से बदलती है, खून बहता है, या अत्यधिक जलन होती है",
    "A lesion is black or has a highly irregular border (to distinguish from melanoma)": "घाव काला है या उसकी सीमा अत्यधिक अनियमित है (मेलानोमा से अलग पहचान के लिए)",
    "Cryotherapy": "क्रायोथेरेपी (फ्रीजिंग)",
    "Curettage or Shave excision": "क्यूरेटेज या शेव निष्कासन (Curettage)",
    "Benign epidermal growth removal if cosmetically undesirable or physically irritated.": "कॉस्मेटिक रूप से अवांछित या शारीरिक रूप से चिड़चिड़े सौम्य एपिडर्मल विकास को हटाना।",
    "Do not try to scratch off growths at home as it causes bleeding and infection": "घर पर गांठों को खरोंचने की कोशिश न करें क्योंकि इससे रक्तस्राव और संक्रमण होता है",
    "Consult a doctor to rule out melanoma": "मेलानोमा की संभावना को खारिज करने के लिए डॉक्टर से सलाह लें",
    "Temporary localized redness or swelling": "अस्थायी स्थानीय लालिमा या सूजन",
    "Not applicable.": "लागू नहीं है।",

    # Tinea
    "Apply OTC antifungal creams (clotrimazole, miconazole, terbinafine) daily as directed": "निर्देशानुसार प्रतिदिन बिना पर्चे वाली एंटीफंगल क्रीम (क्लोट्रिमेज़ोल, मिकोनाज़ोल) लगाएं",
    "Keep the infected area clean and dry": "संक्रमित क्षेत्र को साफ और सूखा रखें",
    "Wash towels and bedding in hot water": "तौलिए और बिस्तरों को गर्म पानी में धोएं",
    "Infection does not improve after 2 weeks of OTC treatment": "ओटीसी उपचार के 2 सप्ताह बाद भी संक्रमण में सुधार नहीं होता",
    "Infection spreads to the scalp or nails": "संक्रमण खोपड़ी (Scalp) या नाखूनों में फैलता है",
    "Redness spreads rapidly with severe pain": "तीव्र दर्द के साथ लालिमा तेजी से फैलती है",
    "Fever with spreading redness, warmth, swelling, or red streaks (secondary bacterial infection)": "फैलती लालिमा, गर्मी, सूजन, या लाल धारियों के साथ बुखार (माध्यमिक जीवाणु संक्रमण)",
    "Topical Antifungals (Clotrimazole, Terbinafine, Ketoconazole)": "सामयिक एंटीफंगल (क्लोट्रिमेज़ोल, टेरबिनाफाइन)",
    "Oral Antifungals (for resistant cases)": "ओरल एंटीफंगल गोलियां (प्रतिरोधी मामलों के लिए)",
    "Eradicate dermatophyte or yeast fungal infections of the skin.": "त्वचा के डर्मेटोफाइट या यीस्ट फंगल संक्रमण को खत्म करना।",
    "Apply for the full duration recommended (usually 2-4 weeks) even if skin looks clear": "त्वचा साफ दिखने पर भी अनुशंसित पूरी अवधि (आमतौर पर 2-4 सप्ताह) के लिए लगाएं",
    "Keep the area dry": "क्षेत्र को सूखा रखें",
    "Mild burning, itching, or redness at the application site": "लगाने की जगह पर हल्की जलन, खुजली या लालिमा",
    "Stop treatment if a severe burning sensation or spreading rash develops.": "यदि तेज जलन महसूस हो या दाने फैलने लगें तो इलाज बंद कर दें।",

    # Healthy
    "Cleanse and moisturize skin twice daily": "दिन में दो बार त्वचा को साफ और मॉइस्चराइज करें",
    "If new rashes, spots, or changing moles develop in the future": "यदि भविष्य में नए दाने, धब्बे या बदलते तिल विकसित हों",
    "No medication is indicated.": "कोई दवा आवश्यक नहीं है।",
    "Not applicable.": "लागू नहीं है।"
}

EN_TO_GU = {
    # Static Lists / General Recommendations
    "Aim for 7-9 hours of sleep nightly to support skin repair.": "ત્વચાના સારા સ્વાસ્થ્ય માટે રાત્રે 7-9 કલાકની ઊંઘ લો.",
    "Practice stress management (breathing exercises, yoga, walking).": "તણાવ મુક્ત રહેવાનો પ્રયાસ કરો (ઊંડા શ્વાસ લેવા, યોગ કરવા, ચાલવું).",
    "Engage in regular moderate exercise; shower promptly afterward.": "નિયમિત મધ્યમ કસરત કરો; તે પછી તરત જ સ્નાન કરો.",
    "Limit smoking and alcohol, which can worsen many skin conditions.": "ધૂમ્રપાન અને દારૂનું સેવન મર્યાદિત કરો, જે ત્વચાની તકલીફો વધારી શકે છે.",
    "Foods rich in omega-3s (walnuts, flaxseed, fish)": "ઓમેગા -3 થી ભરપૂર ખોરાક (અખરોટ, અળસી, માછલી)",
    "Antioxidant-rich fruits and vegetables": "એન્ટીઑકિસડન્ટથી ભરપૂર ફળો અને શાકભાજી",
    "Probiotic foods (yogurt, fermented foods)": "પ્રોબાયોટિક ખોરાક (દહીં, આથો લાવેલા ખોરાક)",
    "Adequate water intake (~2-3 liters/day, individual needs vary)": "પૂરતું પાણી પીવો (~2-3 લીટર/દિવસ, જરૂરિયાત મુજબ)",
    "Refined sugars and high-glycemic index foods": "રિફાઇન્ડ ખાંડ અને ઉચ્ચ ગ્લાયકેમિક ઇન્ડેક્સ ખોરાક",
    "Excessive dairy products if you notice a personal flare correlation": "ડેરી પ્રોડક્ટ્સનું વધુ પડતું સેવન જો તમને અનુકૂળ ન આવતું હોય",
    "Highly processed and fried foods": "વધુ પડતો પ્રોસેસ્ડ અને તળેલો ખોરાક",
    "Limit hot and spicy foods to prevent facial flushing.": "મસાલેદાર અને ગરમ ખોરાક મર્યાદિત કરો.",
    "Maintain steady hydration throughout the day; pair with a fragrance-free moisturizer suited to your skin type.": "દિવસ દરમિયાન હાઇડ્રેશન જાળવો; ત્વચા માટે યોગ્ય સુગંધ રહિત મોઇશ્ચરાઇઝર લગાવો.",
    
    # Severity Guidance
    "Mild presentation: home care and over-the-counter measures are typically a reasonable first step. Monitor for changes.": "હળવી સ્થિતિ: ઘરગથ્થુ સંભાળ અને ઓટીસી ઉપાયો સામાન્ય રીતે યોગ્ય પ્રથમ પગલું છે. ફેરફારો પર નજર રાખો.",
    "Moderate presentation: a consultation with a dermatologist is recommended to confirm diagnosis and discuss treatment options.": "મધ્યમ સ્થિતિ: નિદાનની પુષ્ટિ કરવા અને સારવારના વિકલ્પોની ચર્ચા કરવા ત્વચારોગ વિજ્ઞાનીની સલાહ લેવી ભલામણપાત્ર છે.",
    "Severe / high-risk presentation: please seek dermatologist or emergency care promptly — do not delay professional evaluation.": "ગંભીર / ઉચ્ચ જોખમવાળી સ્થિતિ: કૃપા કરીને તાત્કાલિક ત્વચારોગ વિજ્ઞાની અથવા કટોકટીની સંભાળ મેળવો - વ્યાવસાયિક તપાસમાં વિલંબ કરશો નહીં.",

    # Eczema
    "Apply a thick, fragrance-free moisturizer twice daily": "દિવસમાં બે વાર સુગંધ રહિત જાડું મોઇશ્ચરાઇઝર લગાવો",
    "Take short, lukewarm baths or showers": "નવશેકા પાણીથી ટૂંકો સ્નાન લો",
    "Use gentle, soap-free cleansers": "હળવા, સાબુ મુક્ત ક્લીન્ઝરનો ઉપયોગ કરો",
    "Symptoms do not improve with OTC creams": "ઓટીસી ક્રીમથી લક્ષણોમાં સુધારો થતો નથી",
    "Skin is extremely painful or starts oozing yellow fluid": "ત્વચા પર ખૂબ દુખાવો થાય અથવા પીળું પ્રવાહી નીકળવા લાગે",
    "Itching disrupts sleep": "ખંજવાળને કારણે ઊંઘ ન આવે",
    "Fever with rapid spreading redness, warmth, or red streaks (secondary cellulitis)": "તાવ સાથે ઝડપથી ફેલાતી લાલાશ, ગરમી અથવા લાલ રેખાઓ",
    "Topical Emollients": "ઇમોલિયન્ટ્સ (નરમ ક્રીમ)",
    "Mild Topical Steroids (prescribed)": "હળવા ટોપિકલ સ્ટેરોઇડ્સ (ડોક્ટરની સલાહ મુજબ)",
    "Oral Antihistamines (for itching)": "ઓરલ એન્ટિહિસ્ટામાઈન (ખંજવાળ માટે)",
    "Restore skin barrier hydration and reduce local inflammation and itching.": "ત્વચાની ભેજ જાળવી રાખવી અને લાલાશ તથા ખંજવાળ ઘટાડવી.",
    "Avoid continuous steroid use without supervision": "ડોક્ટરની સલાહ વિના સતત સ્ટેરોઇડનો ઉપયોગ ટાળો",
    "Do not apply steroids on broken/infected skin": "કપાયેલી કે ચેપગ્રસ્ત ત્વચા પર સ્ટેરોઇડ ન લગાવો",
    "Skin thinning with prolonged steroid use": "લાંબા સમય સુધી સ્ટેરોઇડના ઉપયોગથી ત્વચા પાતળી થવી",
    "Drowsiness from certain antihistamines": "અમુક એન્ટિહિસ્ટામાઈનથી સુસ્તી આવવી",
    "Discontinue use if skin irritation or rash worsens after application.": "જો લગાવ્યા પછી ત્વચા પર બળતરા કે ચકામા વધે તો ઉપયોગ બંધ કરો.",

    # Warts
    "Keep growths clean and dry": "મસા કે ગાંઠને સાફ અને સૂકી રાખો",
    "Use OTC salicylic acid treatments for warts (avoid on face)": "મસા માટે ઓટીસી સેલિસિલિક એસિડની સારવાર લો (ચહેરા પર લગાવવાનું ટાળો)",
    "Cover warts with a bandage to prevent spreading": "ફેલાતો અટકાવવા માટે મસા પર પટ્ટી લગાવો",
    "Growths are painful, bleeding, or changing color": "ગાંઠમાં દુખાવો થાય, લોહી નીકળે અથવા રંગ બદલાય",
    "Growths appear on the face or genitals": "ગાંઠ ચહેરા કે ગુપ્તાંગ પર દેખાય",
    "Multiple new lesions appear rapidly": "ઝડપથી નવા નવા મસા થવા લાગે",
    "Severe spreading infection or redness around a lesion accompanied by high fever": "તાવ સાથે મસાની આજુબાજુ તીવ્ર લાલાશ અને ચેપ ફેલાય",
    "Salicylic acid preparations": "સેલિસિલિક એસિડની દવાઓ",
    "Cryotherapy agents (OTC/professional)": "ક્રાયોથેરાપી દવાઓ (ફ્રીઝિંગ સારવાર)",
    "Immune response modifiers (e.g. imiquimod)": "ઇમ્યુન રિસ્પોન્સ મોડિફાયર (જેમ કે ઇમિકીમોડ)",
    "Destructive peeling of viral-infected tissue or stimulating local immune response.": "વાયરસ સંક્રમિત ત્વચાને દૂર કરવી અથવા સ્થાનિક રોગપ્રતિકારક શક્તિ વધારવી.",
    "Avoid contact with eyes, face, or genitals unless specified": "આંખો, ચહેરો કે ગુપ્તાંગના સંપર્કમાં આવવાનું ટાળો",
    "Do not use on bleeding or irritated skin": "લોહી નીકળતું હોય કે બળતરા વાળી ત્વચા પર ઉપયોગ ન કરવો",
    "Skin redness": "ત્વચાની લાલાશ",
    "Localized burning": "જે-તે જગ્યાએ બળતરા થવી",
    "Peeling or blistering": "ચામડી ઉખડવી અથવા ફોલ્લા થવા",
    "Seek medical attention if severe chemical burning, hives, or breathing issues occur.": "જો ગંભીર કેમિકલ બર્ન, અળાઈઓ અથવા શ્વાસ લેવામાં તકલીફ થાય તો તબીબી સારવાર મેળવો.",

    # Melanoma
    "Professional medical evaluation and surgical excision are required immediately. Self-care alone is unsafe.": "તાત્કાલિક વ્યાવસાયિક તબીબી તપાસ અને શસ્ત્રક્રિયા જરૂરી છે. માત્ર સ્વ-સંભાળ જોખમી છે.",
    "Any mole that matches the ABCDE criteria (Asymmetry, Border, Color, Diameter, Evolving)": "કોઈપણ તલ જે ABCDE માપદંડ (અસમપ્રમાણતા, અનિયમિત બોર્ડર, રંગ બદલાવો) ધરાવે છે",
    "A new pigmented growth on previously clear skin": "પહેલાં એકદમ ચોખ્ખી ત્વચા પર નવો કાળો/રંગબેરંગી ડાઘ પડવો",
    "Rapidly growing, bleeding, or ulcerated dark lesion - seek urgent dermatology evaluation immediately.": "ઝડપથી વધતો, લોહી નીકળતો અથવા ચાંદાવાળો કાળો ડાઘ - તાત્કાલિક ત્વચારોગ તપાસ મેળવો.",
    "Surgical excision (primary)": "શસ્ત્રક્રિયા દ્વારા કાઢી નાખવું (મુખ્ય સારવાર)",
    "Immunotherapy": "ઇમ્યુનોથેરાપી (રોગપ્રતિકારક શક્તિ દ્વારા સારવાર)",
    "Targeted therapy": "ટાર્ગેટેડ થેરાપી (લક્ષિત સારવાર)",
    "Chemotherapy / Radiation": "કિમોથેરાપી / રેડિયેશન",
    "Specialist oncology and dermatology treatments. Self-medication is not appropriate.": "કેન્સર નિષ્ણાત અને ત્વચારોગ વિજ્ઞાની દ્વારા જ સારવાર. જાતે દવા લેવી નુકસાનકારક છે.",
    "This is a high-risk malignancy; urgent surgical oncology staging is required": "આ ઉચ્ચ જોખમ ધરાવતું કેન્સર છે; તાત્કાલિક સર્જિકલ સ્ટેજિંગ જરૂરી છે",
    "Do not attempt self-treatment": "જાતે સારવાર કરવાનો પ્રયત્ન કરશો નહીં",
    "Varies widely depending on the prescribed clinical systemic therapy": "નક્કી કરેલી તબીબી પદ્ધતિ પર આધાર રાખે છે",
    "Not applicable — professional oncological intervention is required.": "લાગુ પડતું નથી - વ્યાવસાયિક કેન્સર સારવારની જરૂર છે.",

    # Atopic Dermatitis
    "Moisturize multiple times daily": "દિવસમાં ઘણી વાર મોઇશ્ચરાઇઝર લગાવો",
    "Keep fingernails short to prevent scratching damage": "ખંજવાળને લીધે નખ ટૂંકા રાખો",
    "Wear soft, breathable cotton clothing": "નરમ, સુતરાઉ કપડાં પહેરો",
    "Itching interferes with sleep or daily activities": "ખંજવાળને લીધે ઊંઘ કે રોજિંદી પ્રવૃત્તિમાં ખલેલ પહોંચે",
    "Signs of infection like yellow crusts, pus, or oozing": "ચેપના લક્ષણો જેમ કે પીળો પોપડો વળવો, પરુ થવું",
    "Worsen despite regular moisturizing": "નિયમિત મોઇશ્ચરાઇઝર લગાવવા છતાં તકલીફ વધવી",
    "Widespread painful blisters, skin peeling, and high fever (possible eczema herpeticum)": "વ્યાપક પીડાદાયક ફોલ્લા, ચામડી ઉખડવી અને તીવ્ર તાવ",
    "Thick Emollients/Ceramide creams": "સિરામાઇડ ક્રીમ અથવા ઘટ્ટ ઇમોલિયન્ટ્સ",
    "Topical Corticosteroids": "ટોપિકલ કોર્ટીકોસ્ટેરોઇધ્સ",
    "Calcineurin inhibitors (tacrolimus)": "કેલ્સિન્યુરિન અવરોધકો (ટેક્રોલિમસ)",
    "JAK inhibitors": "જેએકે અવરોધકો",
    "Repair the genetic skin barrier defect and control chronic immune-mediated flares.": "આનુવંશિક ત્વચા અવરોધ ખામી સુધારવી અને ક્રોનિક સોજો નિયંત્રિત કરવો.",
    "Use steroid creams sparingly on thin-skin areas (face, folds)": "પાતળી ચામડી વાળા ભાગો (ચહેરો, ઘડીઓ) પર સ્ટેરોઇડ ક્રીમનો ઓછો ઉપયોગ કરો",
    "Apply moisturizer first": "પહેલા મોઇશ્ચરાઇઝર લગાવો",
    "Temporary burning/stinging at application site": "લગાવવાની જગ્યા પર અસ્થાયી બળતરા/ચચરાટ",
    "Increased risk of localized skin infections": "ત્વચા પર સ્થાનિક ચેપ લાગવાનું જોખમ વધી જવું",
    "Discontinue and consult your doctor if signs of bacterial skin infection (yellow crusts) occur.": "બેક્ટેરિયલ ત્વચા ચેપ (પીળો પોપડો) ના ચિહ્નો દેખાય તો ઉપયોગ બંધ કરી ડોક્ટરની સલાહ લો.",

    # Basal Cell
    "Requires professional dermatologist diagnosis and surgical excision or treatment. Self-treatment is not possible.": "વ્યાવસાયિક ત્વચારોગ નિષ્ણાત નિદાન અને શસ્ત્રક્રિયા જરૂરી છે. જાતે સારવાર શક્ય નથી.",
    "Any skin sore or growth that fails to heal within three to four weeks": "ચામડી પરનું કોઈપણ ચાંદુ અથવા ગાંઠ જે ત્રણ થી ચાર અઠવાડિયામાં મટે નહીં",
    "A pearly bump that slowly enlarges": "ચળકતી ગાંઠ જે ધીમે じめ મોટી થતી જાય",
    "Rapid bleeding or infected skin growth causing localized swelling and fever": "ઝડપથી લોહી નીકળવું અથવા ચામડીની ગાંઠમાં ચેપ થવો અને તાવ આવવો",
    "Surgical excision": "શસ્ત્રક્રિયા દ્વારા કાઢી નાખવું (Surgical Excision)",
    "Mohs micrographic surgery": "મોહ્સ માઇક્રોગ્રાફિક સર્જરી",
    "Topical chemotherapy (imiquimod)": "ટોપિકલ કિમોથેરાપી (ઇમિકીમોડ)",
    "Photodynamic therapy": "ફોટોડાયનેમિક થેરાપી",
    "Eliminate cancerous epidermal basal cells and prevent local tissue damage.": "કેન્સરગ્રસ્ત કોષોનો નાશ કરવો અને આસપાસની ત્વચાને નુકસાન થતું અટકાવવું.",
    "Requires professional diagnosis and removal; home remedies are ineffective and unsafe": "વ્યાવસાયિક નિદાન અને નિકાલ જરૂરી છે; ઘરગથ્થુ ઉપચારો બિનઅસરકારક અને અસુરક્ષિત છે",
    "Localized swelling": "સ્થાનિક સોજો",
    "Redness": "લાલાશ",
    "Scarring at the surgical site": "શસ્ત્રક્રિયાની જગ્યાએ ડાઘ પડવો",
    "Not applicable — requires professional in-clinic treatment.": "લાગુ પડતું નથી - હોસ્પિટલમાં વ્યાવસાયિક સારવારની જરૂર છે.",

    # Moles
    "Perform monthly checks to monitor for changes in size, shape, color, or symmetry.": "કદ, આકાર, રંગ કે સપ્રમાણતામાં ફેરફાર જોવા માટે દર મહિને સ્વ-તપાસ કરો.",
    "A mole becomes asymmetrical, develops irregular borders, exhibits multiple colors, grows larger than 6mm, or starts bleeding/itching": "તલ અસમપ્રમાણ બને, બોર્ડર અનિયમિત થાય, વિવિધ રંગો દેખાય, કદ 6mm થી વધે અથવા લોહી-ખંજવાળ આવે",
    "Professional shave removal": "વ્યાવસાયિક શેવ રિમૂવલ",
    "Surgical excision (with biopsy)": "બાયોપ્સી સાથે શસ્ત્રક્રિયા દ્વારા કાઢવું",
    "Removal of moles if they are irritated by clothing, cosmetically bothersome, or suspicious.": "કપડાંથી ઘસાતા, દેખાવમાં ખરાબ લાગતા અથવા શંકાસ્પદ તલને દૂર કરવા.",
    "Moles must be removed by a doctor to allow laboratory biopsy": "લેબોરેટરી બાયોપ્સી કરવા માટે તલ ડોક્ટર પાસે જ કઢાવવો જોઈએ",
    "Never attempt to cut or freeze a mole at home": "ઘરે ક્યારેય તલ કાપવા કે થીજવવાનો (ફ્રીઝ) પ્રયત્ન કરશો નહીં",
    "Mild surgical scarring": "હળવો ડાઘ",
    "Temporary localized pain": "અસ્થાયી સ્થાનિક દુખાવો",
    "Seek professional dermatological review if a mole changes.": "જો તલમાં ફેરફાર થાય તો વ્યાવસાયિક ત્વચારોગ સલાહ મેળવો.",

    # Benign Keratosis
    "Keep skin moisturized. Avoid picking or scratching the growths, which can cause bleeding or infection.": "ત્વચા મોઇશ્ચરાઇઝ્ડ રાખો. ગાંઠોને ખોતરવાનું ટાળો, જેથી લોહી નીકળવું કે ચેપ લાગવાનું બચી શકાય.",
    "Growths grow rapidly, bleed, or become inflamed": "ગાંઠ ઝડપથી વધે, લોહી નીકળે અથવા સોજો આવે",
    "A growth looks dark, irregular, or has multiple colors (to rule out melanoma)": "ગાંઠ કાળી, અનિયમિત દેખાય અથવા બહુરંગી હોય (મેલાનોમાની શંકા ટાળવા)",
    "Cryotherapy (freezing)": "ક્રાયોથેરાપી (થીજવી દેવું)",
    "Electrocautery / Shave removal": "ઇલેક્ટ્રોકોટેરી / શેવ રિમૂવલ",
    "Laser therapy": "લેસર સારવાર",
    "Safe removal of cosmetic or physically irritated benign keratosis-like lesions.": "શારીરિક રીતે નડતી અથવા અણગમતી સૌમ્ય કેરાટોસિસ ગાંઠો સુરક્ષિત રીતે દૂર કરવી.",
    "Confirm with a dermatologist that the lesion is benign before removal": "ગાંઠ કઢાવતા પહેલા ત્વચારોગ નિષ્ણાત પાસે પુષ્ટિ કરાવો કે તે સૌમ્ય છે",
    "Avoid scratching or peeling": "ખંજવાળવાનું કે ચામડી ઉખેડવાનું ટાળો",
    "Hypopigmentation (lighter skin patch)": "હાઇપોપીગ્મેન્ટેશન (ત્વચાનો રંગ આછો થવો)",
    "Temporary blistering": "કામચલાઉ ફોલ્લા થવા",
    "Consult a doctor if the spot starts growing rapidly or bleeding.": "જો ડાઘ ઝડપથી વધવા લાગે અથવા લોહી નીકળે તો ડોક્ટરનો સંપર્ક કરો.",

    # Psoriasis
    "Moisturize daily with heavy creams": "રોજ ઘટ્ટ ક્રીમ વડે ત્વચા મોઇશ્ચરાઇઝ કરો",
    "Take warm baths with Epsom salts or oatmeal": "એપ્સમ સોલ્ટ અથવા ઓટમીલ નાખીને નવશેકા પાણીથી સ્નાન લો",
    "Limit alcohol intake": "દારૂનું સેવન મર્યાદિત કરો",
    "Joint pain, stiffness, or swelling (indicative of psoriatic arthritis)": "સાંધાનો દુખાવો, જકડાઈ જવું કે સોજો (સોરિયાટિક આર્થરાઈટિસના સંકેત)",
    "Widespread rash covering more than 10% of the body": "શરીરના ૧૦% થી વધુ ભાગ પર ફેલાયેલા ચકામા",
    "Plaques cause severe pain or bleed easily": "પેચોમાં અતિશય દુખાવો થાય અથવા સહેલાઈથી લોહી નીકળે",
    "Widespread redness and peeling skin over the entire body accompanied by chills and high fever (possible erythrodermic psoriasis)": "ધ્રુજારી અને તીવ્ર તાવ સાથે આખા શરીર પર લાલ ચકામા અને ચામડી ઉખડવી",
    "High-potency Topical Corticosteroids": "હાઈ-પોટેન્સી ટોપિકલ કોર્ટીકોસ્ટેરોઇડ્સ",
    "Coal tar formulations": "કોલ ટાર દવાઓ",
    "Vitamin D3 analogues": "વિટામિન ડી3 એનાલોગ",
    "Systemic Biologics": "સિસ્ટમિક બાયોલોજિક્સ",
    "Slow down rapid skin cell production (Psoriasis) and reduce autoimmune-driven skin inflammation.": "ત્વચાના કોષોના ઝડપી વિકાસને ધીમો કરવો અને રોગપ્રતિકારક શક્તિ સંબંધિત સોજો ઘટાડવો.",
    "Do not stop oral/systemic medications suddenly": "મોં વાટે લેવાતી કે અન્ય મુખ્ય દવાઓ અચાનક બંધ ન કરો",
    "Avoid skin injury which can trigger new plaques": "ત્વચા પર ઈજા ટાળો જે નવા પેચ ઉત્તેજિત કરી શકે",
    "Systemic immunosuppression (with biologic agents)": "રોગપ્રતિકારક શક્તિમાં ઘટાડો થવો",
    "Seek immediate medical attention if you experience severe joint pain, widespread skin redness, or fever.": "જો તમને સાંધાનો તીવ્ર દુખાવો, વ્યાપક લાલાશ અથવા તાવ આવે તો તરત જ તબીબી સારવાર લો.",

    # Seborrheic
    "Avoid scratching or picking at the lesions, which can lead to bleeding, pain, and secondary infection.": "જગ્યા પર ખંજવાળવાનું કે ખોતરવાનું ટાળો, જેથી લોહી નીકળવું કે વધુ ચેપ લાગી શકે.",
    "A growth changes rapidly, bleeds, or becomes highly irritated": "ગાંઠ ઝડપથી બદલાય, લોહી નીકળે અથવા ભારે બળતરા થાય",
    "A lesion is black or has a highly irregular border (to distinguish from melanoma)": "ડાઘ કાળો હોય અથવા બોર્ડર અસમાન હોય (મેલાનોમાથી અલગ પાડવા)",
    "Cryotherapy": "ક્રાયોથેરાપી (ફ્રીઝીંગ)",
    "Curettage or Shave excision": "ક્યુરેટાજ અથવા શેવ એક્સિઝન",
    "Benign epidermal growth removal if cosmetically undesirable or physically irritated.": "ખરાબ દેખાતી અથવા નડતરરૂપ સૌમ્ય ત્વચા ગાંઠો દૂર કરવી.",
    "Do not try to scratch off growths at home as it causes bleeding and infection": "ઘરે તેને ખોતરવાનો પ્રયાસ ન કરો કારણ કે તેનાથી લોહી નીકળશે અને ચેપ લાગશે",
    "Consult a doctor to rule out melanoma": "મેલાનોમાની શક્યતા નકારવા માટે ડોક્ટરની સલાહ લો",
    "Temporary localized redness or swelling": "અસ્થાયી સ્થાનિક લાલાશ કે સોજો",
    "Not applicable.": "લાગુ પડતું નથી.",

    # Tinea
    "Apply OTC antifungal creams (clotrimazole, miconazole, terbinafine) daily as directed": "સૂચના મુજબ રોજ ઓટીસી એન્ટિફંગલ ક્રીમ (ક્લોટ્રિમેઝોલ, ટર્બીનાફાઇન) લગાવો",
    "Keep the infected area clean and dry": "ચેપગ્રસ્ત ભાગને સાફ અને સૂકો રાખો",
    "Wash towels and bedding in hot water": "ટુવાલ અને ચાદરો ગરમ પાણીથી ધોવો",
    "Infection does not improve after 2 weeks of OTC treatment": "૨ અઠવાડિયાની ઓટીસી સારવાર પછી પણ ચેપમાં સુધારો ન થાય",
    "Infection spreads to the scalp or nails": "ચેપ માથાની ચામડી કે નખ સુધી ફેલાય",
    "Redness spreads rapidly with severe pain": "લાલાશ તીવ્ર દુખાવા સાથે ઝડપથી ફેલાય",
    "Fever with spreading redness, warmth, swelling, or red streaks (secondary bacterial infection)": "તાવ સાથે ફેલાતી લાલાશ, ગરમી, સોજો અથવા લાલ રેખાઓ",
    "Topical Antifungals (Clotrimazole, Terbinafine, Ketoconazole)": "ટોપિકલ એન્ટિફંગલ ક્રીમ",
    "Oral Antifungals (for resistant cases)": "ઓરલ એન્ટિફંગલ ગોળીઓ",
    "Eradicate dermatophyte or yeast fungal infections of the skin.": "ત્વચા પરથી ફંગલ અથવા યીસ્ટ ઇન્ફેક્શન દૂર કરવું.",
    "Apply for the full duration recommended (usually 2-4 weeks) even if skin looks clear": "ચામડી સાફ દેખાય તો પણ ડોક્ટરે કહેલી આખી મુદત (આશરે ૨-૪ અઠવાડિયા) માટે લગાવો",
    "Keep the area dry": "તે ભાગ કોરો રાખો",
    "Mild burning, itching, or redness at the application site": "લગાવવાની જગ્યાએ સામાન્ય બળતરા, ખંજવાળ કે લાલાશ થવી",
    "Stop treatment if a severe burning sensation or spreading rash develops.": "જો તીવ્ર બળતરા અથવા ફોલ્લીઓ ફેલાવા લાગે તો સારવાર બંધ કરો.",

    # Healthy
    "Cleanse and moisturize skin twice daily": "દિવસમાં બે વાર ત્વચા સાફ કરો અને મોઇશ્ચરાઇઝ કરો",
    "If new rashes, spots, or changing moles develop in the future": "જો ભવિષ્યમાં નવા ચકામા, ડાઘ અથવા બદલાતા તલ દેખાય",
    "No medication is indicated.": "કોઈ દવાની જરૂર નથી.",
    "Not applicable.": "લાગુ પડતું નથી."
}

def translate_text(text: str, lang: str) -> str:
    if not text:
        return text
    if lang == "hi":
        return EN_TO_HI.get(text, text)
    if lang == "gu":
        return EN_TO_GU.get(text, text)
    return text

def translate_recommendation(rec: dict, lang: str) -> dict:
    if lang not in ("hi", "gu"):
        return rec
    
    translated = copy.deepcopy(rec)
    
    # Translate severity guidance
    if "severity_guidance" in translated:
        translated["severity_guidance"] = translate_text(translated["severity_guidance"], lang)
        
    # Translate hydration
    if "hydration" in translated:
        translated["hydration"] = translate_text(translated["hydration"], lang)
        
    # Translate lists
    if "skin_care" in translated:
        translated["skin_care"] = [translate_text(x, lang) for x in translated["skin_care"]]
    if "lifestyle" in translated:
        translated["lifestyle"] = [translate_text(x, lang) for x in translated["lifestyle"]]
    if "diet_recommended" in translated:
        translated["diet_recommended"] = [translate_text(x, lang) for x in translated["diet_recommended"]]
    if "diet_avoid" in translated:
        translated["diet_avoid"] = [translate_text(x, lang) for x in translated["diet_avoid"]]
    if "when_to_consult_doctor" in translated:
        translated["when_to_consult_doctor"] = [translate_text(x, lang) for x in translated["when_to_consult_doctor"]]
    if "emergency_warning_signs" in translated:
        translated["emergency_warning_signs"] = [translate_text(x, lang) for x in translated["emergency_warning_signs"]]
        
    # Translate medication_info
    if "medication_info" in translated:
        med = translated["medication_info"]
        if "general_purpose" in med:
            med["general_purpose"] = translate_text(med["general_purpose"], lang)
        if "categories" in med:
            med["categories"] = [translate_text(x, lang) for x in med["categories"]]
        if "side_effects" in med:
            med["side_effects"] = [translate_text(x, lang) for x in med["side_effects"]]
        if "precautions" in med:
            med["precautions"] = [translate_text(x, lang) for x in med["precautions"]]
        if "allergy_warning" in med:
            med["allergy_warning"] = translate_text(med["allergy_warning"], lang)
            
    return translated
