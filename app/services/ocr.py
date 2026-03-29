import google.generativeai as genai
import json
import io
from app.core.config import settings

def extract_receipt_data(image_bytes: bytes):
    try:
        genai.configure(api_key=settings.API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash") # The user asked for 2.5 but 1.5 worked earlier? Wait, I saw 2.5 in their prompt.
        
        # User prompt in step 238: "Use the gemini-2.5-flash model."
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = """
        Analyze this receipt. Extract the total amount, currency (in 3-letter ISO code), 
        date of the transaction (YYYY-MM-DD), merchant name, and guess the category 
        (e.g., Travel, Meals, Supplies). 
        Return ONLY a raw JSON object with keys: amount, currency, date, merchant_name, category.
        """
        
        # Construct the image part
        image_part = {
            "mime_type": "image/jpeg", # Defaulting to jpeg
            "data": image_bytes
        }
        
        response = model.generate_content([prompt, image_part])
        
        # Clean up the response text (it might contain markdown blocks)
        cleaned_response = response.text.strip('` \n').replace('json\n', '', 1)
        
        return json.loads(cleaned_response)
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise e
