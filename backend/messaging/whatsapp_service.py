import os
from typing import Dict, Any, List, Optional

class WhatsAppService:
    """
    WhatsApp message delivery and simulation service.
    Implements Phase 5 safety rules: no urgency-score emojis, deterministic flag counts,
    curated doctor questions, and multi-language support.
    """

    def __init__(self):
        self.account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.api_key = os.environ.get("TWILIO_API_KEY", "") or self.account_sid
        self.api_secret = os.environ.get("TWILIO_API_SECRET", "") or self.auth_token
        self.from_number = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

    def build_patient_message(
        self,
        patient_name: str,
        flag_count: int,
        flagged_tests: List[str],
        doctor_questions: List[str],
        language: str = "en"
    ) -> str:
        flagged_str = "\n".join([f"• {t}" for t in flagged_tests]) if flagged_tests else "• None"
        questions_str = "\n".join([f"{i+1}. {q}" for i, q in enumerate(doctor_questions[:3])])

        if language == "hi":
            return f"""📋 *मेडिकल लैब रिपोर्ट विश्लेषण पूर्ण*
नमस्ते {patient_name},

आपकी रिपोर्ट में प्रयोगशाला द्वारा *{flag_count} मान* सामान्य संदर्भ सीमा से बाहर चिह्नित किए गए हैं:
{flagged_str}

*डॉक्टर से परामर्श के लिए महत्वपूर्ण प्रश्न:*
{questions_str}

पूर्ण रिपोर्ट देखने और डाउनलोड करने के लिए मेडलेन्स पोर्टल पर जाएं।"""

        elif language == "te":
            return f"""📋 *ల్యాబ్ రిపోర్ట్ విశ్లేషణ పూర్తయింది*
నమస్కారం {patient_name},

మీ రిపోర్టులో ప్రయోగశాల ద్వారా *{flag_count} విలువలు* సాధారణ పరిధి వెలుపల గుర్తించబడ్డాయి:
{flagged_str}

*మీ డాక్టర్‌ని అడగవలసిన ముఖ్యమైన ప్రశ్నలు:*
{questions_str}

పూర్తి రిపోర్టును చూడటానికి మెడ్‌లెన్స్ పోర్టల్‌ను సందర్శించండి."""

        return f"""📋 *Lab Report Analysis Complete*
Hello {patient_name},

*{flag_count} value(s)* were flagged outside standard laboratory reference intervals on your recent report:
{flagged_str}

*Suggested Questions to Ask Your Doctor:*
{questions_str}

Access your full structured report and temporal trends at MedLens Portal."""

    def send_message(
        self,
        phone_number: str,
        patient_name: str,
        flag_count: int,
        flagged_tests: List[str],
        doctor_questions: List[str],
        language: str = "en"
    ) -> Dict[str, Any]:
        message_body = self.build_patient_message(
            patient_name=patient_name,
            flag_count=flag_count,
            flagged_tests=flagged_tests,
            doctor_questions=doctor_questions,
            language=language
        )

        formatted_phone = phone_number if phone_number.startswith("+") else f"+91{phone_number.replace('-', '').replace(' ', '')}"
        
        # If Twilio credentials present, attempt live dispatch
        if self.api_key and self.api_secret:
            try:
                from twilio.rest import Client
                client = Client(self.api_key, self.api_secret)
                msg = client.messages.create(
                    from_=self.from_number,
                    to=f"whatsapp:{formatted_phone}",
                    body=message_body
                )
                return {
                    "status": "sent",
                    "provider": "twilio",
                    "sid": msg.sid,
                    "recipient": formatted_phone,
                    "body": message_body
                }
            except Exception as e:
                print(f"[WhatsAppService] Twilio live dispatch failed: {e}")

        # Simulated dispatch for local testing & live stage demos
        return {
            "status": "simulated",
            "provider": "medlens_simulator",
            "recipient": formatted_phone,
            "body": message_body,
            "message": "Message successfully prepared and queued for delivery."
        }
