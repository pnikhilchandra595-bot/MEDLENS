import os
import json
from typing import List, Dict, Any, Optional

class AdversarialInterpreter:
    """
    Adversarial AI Layer & Clinical Safety Engine.
    Enforces non-diagnostic descriptive phrasing, gated counter-explanations,
    deterministic lab flag counting, and multilingual localization.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")

    def generate_clinical_intelligence(
        self,
        extracted_results: List[Dict[str, Any]],
        temporal_analysis: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Executes full Phase 3 pipeline:
        1. Deterministic source flag count (counts what the laboratory flagged, no AI risk score).
        2. Non-diagnostic descriptive pattern summary.
        3. Gated adversarial counter-argument (2 alternative non-diagnostic explanations).
        4. Curated questions for doctor consultation.
        5. Multilingual localization (EN / HI / TE).
        """
        # 1. Deterministic source-flag count
        flag_count = sum(1 for r in extracted_results if r.get("is_abnormal"))
        flagged_tests = [r for r in extracted_results if r.get("is_abnormal")]
        flagged_names = [r.get("canonical_name") or r.get("test_name") for r in flagged_tests]

        # 2. Generate Primary Non-Diagnostic Interpretation
        primary_summary = self._generate_primary_interpretation(extracted_results, temporal_analysis, language)

        # 3. Generate Gated Adversarial Counter-Prompt
        counter_explanations = self._generate_counter_explanations(primary_summary, flagged_tests, language)

        # 4. Generate Doctor Consultation Questions
        doctor_questions = self._generate_doctor_questions(flagged_tests, temporal_analysis, language)

        return {
            "flag_count": flag_count,
            "flagged_tests_count_text": self._format_flag_count_text(flag_count, language),
            "flagged_markers": flagged_names,
            "primary_summary": primary_summary,
            "counter_explanations": counter_explanations,
            "doctor_questions": doctor_questions,
            "language": language,
            "source": "AI-generated"
        }

    def _format_flag_count_text(self, count: int, language: str) -> str:
        if language == "hi":
            return f"आपकी रिपोर्ट में प्रयोगशाला द्वारा {count} मान असामान्य चिह्नित किए गए हैं।"
        elif language == "te":
            return f"మీ ల్యాబ్ రిపోర్ట్‌లో {count} విలువలు అసాధారణంగా గుర్తించబడ్డాయి."
        return f"{count} value{'s' if count != 1 else ''} flagged outside standard laboratory reference range."

    def _generate_primary_interpretation(
        self,
        extracted_results: List[Dict[str, Any]],
        temporal_analysis: Optional[Dict[str, Any]],
        language: str
    ) -> str:
        # Build prompt or use deterministic localized template
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
                Patient lab findings: {json.dumps(extracted_results, default=str)}
                Temporal trend info: {json.dumps(temporal_analysis, default=str)}
                Language: {language}

                Generate a plain-language, strictly non-diagnostic description of the values across time.
                SAFETY CONSTRAINTS:
                - Do NOT diagnose or name any disease/illness/condition (e.g. do not say hypothyroidism, anemia, diabetes, etc.).
                - Do NOT assign any risk score, urgency number, or triage severity.
                - Focus ONLY on which numerical lab values changed or are outside reference bounds.
                - Maximum 3 sentences.
                - Output ONLY the summary text in the requested language ({language}).
                """
                resp = model.generate_content(prompt)
                if resp.text and len(resp.text.strip()) > 10:
                    return resp.text.strip()
            except Exception as e:
                print(f"[AdversarialAI] Gemini call failed, using deterministic template: {e}")

        # High quality localized deterministic template
        flagged = [r for r in extracted_results if r.get("is_abnormal")]
        if not flagged:
            if language == "hi":
                return "इस रिपोर्ट में सभी रिकॉर्ड किए गए परीक्षण मान प्रयोगशाला संदर्भ सीमा के भीतर हैं।"
            elif language == "te":
                return "ఈ నివేదికలోని అన్ని పరీక్షల విలువలు ప్రామాణిక ప్రయోగశాల పరిధిలోనే ఉన్నాయి."
            return "All recorded laboratory test values on this report are currently within their standard reference intervals."

        names_str = ", ".join([r.get("canonical_name") or r.get("test_name") for r in flagged[:3]])
        
        # Check temporal shifts
        trends = (temporal_analysis or {}).get("analyte_trends", {})
        shifts = []
        for k, v in trends.items():
            if v.get("direction") in ["increasing", "decreasing"]:
                shifts.append(f"{v.get('marker_name')} ({v.get('direction')})")

        shift_text = f" Across recorded dates, shifts were observed in {', '.join(shifts[:2])}." if shifts else ""

        if language == "hi":
            return f"आपकी वर्तमान रिपोर्ट में {names_str} के मान प्रयोगशाला संदर्भ सीमा से बाहर हैं।{shift_text} यह विवरण केवल संख्यात्मक परिवर्तनों का सारांश है।"
        elif language == "te":
            return f"మీ ప్రస్తుత రిపోర్టులో {names_str} విలువలు సాధారణ ప్రయోగశాల పరిధి కంటే భిన్నంగా ఉన్నాయి.{shift_text} ఇది సంఖ్యా మార్పుల వివరాలు మాత్రమే."
        return f"On your report, {names_str} {'is' if len(flagged)==1 else 'are'} outside standard laboratory reference intervals.{shift_text} This review outlines numerical shifts for physician consultation."

    def _generate_counter_explanations(
        self,
        primary_interpretation: str,
        flagged_tests: List[Dict[str, Any]],
        language: str
    ) -> List[str]:
        """
        Improvisation #3 & Phase 3.2: Gated counter-argument.
        Provides 2 alternative, non-diagnostic explanations for observed shifts
        (hydration, fasting status, diurnal variation, recent physical stress).
        """
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
                Given this non-diagnostic lab observation: "{primary_interpretation}"
                List exactly 2 plausible, non-diagnostic alternative physiological or technical explanations for these variations (e.g., hydration levels, fasting duration, time of blood collection, recent strenuous exertion, or lab assay differences).
                Format as JSON array of 2 short strings in language: {language}.
                """
                resp = model.generate_content(prompt)
                text = resp.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())
                if isinstance(parsed, list) and len(parsed) >= 2:
                    return parsed[:2]
            except Exception as e:
                print(f"[AdversarialAI] Counter-prompt fallback: {e}")

        # Curated clinical non-diagnostic alternatives
        if language == "hi":
            return [
                "हाइड्रेशन स्तर, उपवास की अवधि (Fasting duration) या रक्त के नमूने के समय में अंतर के कारण मानों में सामान्य उतार-चढ़ाव हो सकता है।",
                "हाल ही में किए गए शारीरिक श्रम, तनाव, या विभिन्न प्रयोगशाला परीक्षण विधियों (Assay methods) का प्रभाव हो सकता है।"
            ]
        elif language == "te":
            return [
                "శరీరంలో నీటి శాతం (Hydration), ఉపవాస సమయం లేదా రక్త నమూనా తీసుకున్న సమయం వల్ల ఈ విలువల్లో తేడాలు ఉండవచ్చు.",
                "ఇటీవలి శారీరక శ్రమ, అలసట లేదా వేర్వేరు ల్యాబ్ పరీక్షా విధానాల వల్ల కూడా ఫలితాల్లో స్వల్ప మార్పులు రావచ్చు."
            ]
        return [
            "Variations in hydration status, exact fasting duration, or time of day of blood collection can naturally shift circulating analyte concentrations.",
            "Recent physical exertion, temporary dietary changes, or differences in laboratory assay calibration between test batches."
        ]

    def _generate_doctor_questions(
        self,
        flagged_tests: List[Dict[str, Any]],
        temporal_analysis: Optional[Dict[str, Any]],
        language: str
    ) -> List[str]:
        if language == "hi":
            return [
                "क्या मुझे इन मानों की पुष्टि के लिए एक निश्चित समय के बाद दोबारा परीक्षण (Retest) कराना चाहिए?",
                "क्या मेरी वर्तमान दवाएं, आहार या जीवनशैली इन परीक्षण परिणामों को प्रभावित कर रही हैं?",
                "क्या इन परीक्षण मानों के लिए मुझे किसी अन्य विशिष्ट जांच की आवश्यकता है?"
            ]
        elif language == "te":
            return [
                "ఈ విలువల నిర్ధారణ కోసం నేను మళ్ళీ ఎప్పుడు పరీక్ష చేయించుకోవాలి?",
                "నేను వాడుతున్న మందులు లేదా ఆహారపు అలవాట్లు ఈ ఫలితాలపై ఏమైనా ప్రభావం చూపుతున్నాయా?",
                "ఈ నివేదిక ఆధారంగా నాకు ఇంకేమైనా తదుపరి పరీక్షలు అవసరమా?"
            ]
        return [
            "Would you recommend a follow-up retest in 4 to 8 weeks to observe if these values remain consistent?",
            "Could my current dietary routine, supplements, or medications be contributing to these specific shifts?",
            "Are there any complementary biomarker checks or physical assessments you would advise based on these trends?"
        ]
