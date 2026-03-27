from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import math
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Configuration
LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'openai')
LLM_MODEL = os.environ.get('LLM_MODEL', 'gpt-5.2')
ALPHA_VANTAGE_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY')

# Create the main app
app = FastAPI(title="RMIE - Raw Material Intelligence Engine")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class MaterialPrice(BaseModel):
    material_id: str
    name: str
    category: str
    current_price: float
    currency: str = "USD"
    unit: str
    change_24h: float
    change_7d: float
    change_30d: float
    volume_24h: float
    high_24h: float
    low_24h: float
    last_updated: str

class PriceHistoryPoint(BaseModel):
    timestamp: str
    price: float
    volume: float

class Forecast(BaseModel):
    date: str
    predicted_price: float
    lower_bound: float
    upper_bound: float
    confidence: float

class SupplierInfo(BaseModel):
    id: str
    name: str
    country: str
    reliability_score: float
    price_competitiveness: float
    lead_time_days: int
    materials: List[str]
    avg_price_deviation: float

class BOMItem(BaseModel):
    component: str
    material: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float
    cost_percentage: float

class Alert(BaseModel):
    id: str
    material: str
    alert_type: str
    threshold: float
    current_value: float
    triggered: bool
    created_at: str

class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    impact: str
    affected_materials: List[str]
    source: str
    timestamp: str
    sentiment: str

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class LLMConfigUpdate(BaseModel):
    provider: str
    model: str

class CurrencyConfig(BaseModel):
    base_currency: str = "USD"
    target_currency: str = "INR"

# Currency exchange rates (mock - in production, use forex API)
EXCHANGE_RATES = {
    "USD_INR": 83.25,
    "USD_EUR": 0.92,
    "USD_GBP": 0.79,
    "INR_USD": 0.012,
}

def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount between currencies"""
    if from_currency == to_currency:
        return amount
    key = f"{from_currency}_{to_currency}"
    if key in EXCHANGE_RATES:
        return amount * EXCHANGE_RATES[key]
    # Try reverse
    reverse_key = f"{to_currency}_{from_currency}"
    if reverse_key in EXCHANGE_RATES:
        return amount / EXCHANGE_RATES[reverse_key]
    return amount

# ==================== MOCK DATA GENERATORS ====================

# Material definitions with realistic base prices
MATERIALS = {
    "steel_hr": {"name": "Hot Rolled Steel", "category": "Metals", "base_price": 680, "unit": "MT", "volatility": 0.02},
    "steel_cr": {"name": "Cold Rolled Steel", "category": "Metals", "base_price": 850, "unit": "MT", "volatility": 0.025},
    "aluminium": {"name": "Aluminium", "category": "Metals", "base_price": 2450, "unit": "MT", "volatility": 0.03},
    "copper": {"name": "Copper", "category": "Metals", "base_price": 8500, "unit": "MT", "volatility": 0.035},
    "rubber_nr": {"name": "Natural Rubber", "category": "Polymers & Rubber", "base_price": 1650, "unit": "MT", "volatility": 0.04},
    "rubber_sr": {"name": "Synthetic Rubber", "category": "Polymers & Rubber", "base_price": 1820, "unit": "MT", "volatility": 0.03},
    "abs_plastic": {"name": "ABS Plastic", "category": "Polymers & Rubber", "base_price": 1950, "unit": "MT", "volatility": 0.025},
    "pp_plastic": {"name": "Polypropylene", "category": "Polymers & Rubber", "base_price": 1150, "unit": "MT", "volatility": 0.02},
    "pcb": {"name": "PCB Components", "category": "Electronics", "base_price": 45, "unit": "unit", "volatility": 0.015},
    "semiconductors": {"name": "Semiconductors", "category": "Electronics", "base_price": 12.50, "unit": "unit", "volatility": 0.05},
}

# Grade definitions for each material
MATERIAL_GRADES = {
    "steel_hr": {
        "name": "Hot Rolled Steel",
        "grades": [
            {"id": "astm_a36", "name": "ASTM A36", "description": "Structural steel", "price_modifier": 1.0},
            {"id": "sae_1018", "name": "SAE 1018", "description": "Low carbon steel", "price_modifier": 1.05},
            {"id": "sae_1020", "name": "SAE 1020", "description": "Low carbon steel", "price_modifier": 1.03},
            {"id": "is_2062_e250", "name": "IS 2062 E250", "description": "Indian standard structural", "price_modifier": 0.98},
            {"id": "is_2062_e350", "name": "IS 2062 E350", "description": "Indian standard high strength", "price_modifier": 1.08},
            {"id": "s235", "name": "S235 (EN)", "description": "European structural steel", "price_modifier": 1.02},
            {"id": "s275", "name": "S275 (EN)", "description": "European structural steel", "price_modifier": 1.06},
            {"id": "s355", "name": "S355 (EN)", "description": "European high strength", "price_modifier": 1.12},
        ]
    },
    "steel_cr": {
        "name": "Cold Rolled Steel",
        "grades": [
            {"id": "sae_1008", "name": "SAE 1008", "description": "Extra low carbon", "price_modifier": 1.0},
            {"id": "sae_1010", "name": "SAE 1010", "description": "Low carbon", "price_modifier": 1.02},
            {"id": "sae_1018_cr", "name": "SAE 1018", "description": "Low carbon cold rolled", "price_modifier": 1.05},
            {"id": "dc01", "name": "DC01 (EN)", "description": "Drawing quality", "price_modifier": 1.08},
            {"id": "dc03", "name": "DC03 (EN)", "description": "Deep drawing", "price_modifier": 1.12},
            {"id": "dc04", "name": "DC04 (EN)", "description": "Extra deep drawing", "price_modifier": 1.18},
            {"id": "is513_cr1", "name": "IS 513 CR1", "description": "Indian commercial quality", "price_modifier": 0.95},
            {"id": "is513_cr2", "name": "IS 513 CR2", "description": "Indian drawing quality", "price_modifier": 1.0},
            {"id": "is513_cr3", "name": "IS 513 CR3", "description": "Indian deep drawing", "price_modifier": 1.05},
        ]
    },
    "aluminium": {
        "name": "Aluminium",
        "grades": [
            {"id": "al_1100", "name": "1100", "description": "Commercial pure aluminium", "price_modifier": 0.95},
            {"id": "al_3003", "name": "3003", "description": "General purpose alloy", "price_modifier": 1.0},
            {"id": "al_5052", "name": "5052", "description": "Corrosion resistant", "price_modifier": 1.08},
            {"id": "al_6061", "name": "6061", "description": "Structural alloy", "price_modifier": 1.15},
            {"id": "al_7075", "name": "7075", "description": "High strength aerospace", "price_modifier": 1.45},
        ]
    },
    "copper": {
        "name": "Copper",
        "grades": [
            {"id": "c10100", "name": "C10100", "description": "Oxygen-free electronic", "price_modifier": 1.25},
            {"id": "c11000", "name": "C11000", "description": "Electrolytic tough pitch", "price_modifier": 1.0},
            {"id": "c12200", "name": "C12200", "description": "Phosphorus deoxidized", "price_modifier": 1.05},
            {"id": "c26000", "name": "C26000", "description": "Cartridge brass", "price_modifier": 0.85},
        ]
    },
    "rubber_nr": {
        "name": "Natural Rubber",
        "grades": [
            {"id": "rss1", "name": "RSS1", "description": "Ribbed Smoked Sheet Grade 1", "price_modifier": 1.15},
            {"id": "rss3", "name": "RSS3", "description": "Ribbed Smoked Sheet Grade 3", "price_modifier": 1.0},
            {"id": "tsr10", "name": "TSR 10", "description": "Technically Specified Rubber 10", "price_modifier": 1.08},
            {"id": "tsr20", "name": "TSR 20", "description": "Technically Specified Rubber 20", "price_modifier": 0.95},
            {"id": "isnr5", "name": "ISNR 5", "description": "Indian Standard NR Grade 5", "price_modifier": 1.12},
            {"id": "isnr10", "name": "ISNR 10", "description": "Indian Standard NR Grade 10", "price_modifier": 1.05},
            {"id": "isnr20", "name": "ISNR 20", "description": "Indian Standard NR Grade 20", "price_modifier": 0.92},
        ]
    },
    "rubber_sr": {
        "name": "Synthetic Rubber",
        "grades": [
            {"id": "sbr_1502", "name": "SBR 1502", "description": "Styrene Butadiene Rubber", "price_modifier": 1.0},
            {"id": "br", "name": "BR", "description": "Butadiene Rubber", "price_modifier": 1.08},
            {"id": "nbr", "name": "NBR", "description": "Nitrile Rubber", "price_modifier": 1.25},
            {"id": "epdm", "name": "EPDM", "description": "Ethylene Propylene Diene", "price_modifier": 1.35},
            {"id": "cr_neoprene", "name": "CR (Neoprene)", "description": "Chloroprene Rubber", "price_modifier": 1.45},
        ]
    },
    "abs_plastic": {
        "name": "ABS Plastic",
        "grades": [
            {"id": "abs_gp", "name": "General Purpose ABS", "description": "Standard applications", "price_modifier": 1.0},
            {"id": "abs_hi", "name": "High Impact ABS", "description": "Impact resistant", "price_modifier": 1.12},
            {"id": "abs_fr", "name": "Flame Retardant ABS", "description": "Fire resistant", "price_modifier": 1.35},
            {"id": "abs_medical", "name": "Medical Grade ABS", "description": "Healthcare applications", "price_modifier": 1.65},
            {"id": "abs_injection", "name": "Injection Molding Grade", "description": "High flow", "price_modifier": 1.08},
        ]
    },
    "pp_plastic": {
        "name": "Polypropylene",
        "grades": [
            {"id": "pp_homo", "name": "Homopolymer (PP-H)", "description": "Standard PP", "price_modifier": 1.0},
            {"id": "pp_copo", "name": "Copolymer (PP-C)", "description": "Block copolymer", "price_modifier": 1.08},
            {"id": "pp_random", "name": "Random Copolymer", "description": "Clarity applications", "price_modifier": 1.12},
            {"id": "pp_impact", "name": "Impact Copolymer", "description": "High impact", "price_modifier": 1.15},
            {"id": "pp_fiber", "name": "Fiber Grade PP", "description": "Textile applications", "price_modifier": 1.05},
        ]
    },
    "pcb": {
        "name": "PCB Components",
        "grades": [
            {"id": "ipc_class1", "name": "IPC Class 1", "description": "Consumer electronics", "price_modifier": 0.85},
            {"id": "ipc_class2", "name": "IPC Class 2", "description": "Industrial applications", "price_modifier": 1.0},
            {"id": "ipc_class3", "name": "IPC Class 3", "description": "High reliability - Automotive, Aerospace", "price_modifier": 1.45},
        ]
    },
    "semiconductors": {
        "name": "Semiconductors",
        "grades": [
            {"id": "semi_commercial", "name": "Commercial Grade", "description": "0°C to 70°C range", "price_modifier": 1.0},
            {"id": "semi_industrial", "name": "Industrial Grade", "description": "-40°C to 85°C range", "price_modifier": 1.25},
            {"id": "semi_automotive", "name": "Automotive Grade (AEC-Q100)", "description": "Automotive qualified", "price_modifier": 1.65},
            {"id": "semi_military", "name": "Military Grade", "description": "-55°C to 125°C range", "price_modifier": 2.5},
        ]
    },
}

# Automotive component mapping
COMPONENT_MAPPING = {
    "wiring_harness": {"materials": ["copper", "abs_plastic"], "plant_usage": {"Plant A": 15000, "Plant B": 12000}},
    "switches": {"materials": ["abs_plastic", "copper", "pcb"], "plant_usage": {"Plant A": 8000, "Plant B": 6500}},
    "lighting_assembly": {"materials": ["aluminium", "pcb", "abs_plastic"], "plant_usage": {"Plant A": 5000, "Plant B": 4200}},
    "sensors": {"materials": ["semiconductors", "pcb", "copper"], "plant_usage": {"Plant A": 20000, "Plant B": 18000}},
    "body_panels": {"materials": ["steel_hr", "steel_cr"], "plant_usage": {"Plant A": 3000, "Plant B": 2800}},
    "tires": {"materials": ["rubber_nr", "rubber_sr"], "plant_usage": {"Plant A": 4000, "Plant B": 3500}},
    "interior_trim": {"materials": ["pp_plastic", "abs_plastic"], "plant_usage": {"Plant A": 6000, "Plant B": 5500}},
}

SUPPLIERS = [
    {"id": "SUP001", "name": "Tata Steel", "country": "India", "reliability_score": 92, "materials": ["steel_hr", "steel_cr"]},
    {"id": "SUP002", "name": "Hindalco Industries", "country": "India", "reliability_score": 89, "materials": ["aluminium"]},
    {"id": "SUP003", "name": "Aurubis AG", "country": "Germany", "reliability_score": 95, "materials": ["copper"]},
    {"id": "SUP004", "name": "MRF Tyres", "country": "India", "reliability_score": 88, "materials": ["rubber_nr", "rubber_sr"]},
    {"id": "SUP005", "name": "SABIC", "country": "Saudi Arabia", "reliability_score": 91, "materials": ["abs_plastic", "pp_plastic"]},
    {"id": "SUP006", "name": "Samsung SDI", "country": "South Korea", "reliability_score": 94, "materials": ["pcb", "semiconductors"]},
    {"id": "SUP007", "name": "JSW Steel", "country": "India", "reliability_score": 90, "materials": ["steel_hr", "steel_cr"]},
    {"id": "SUP008", "name": "Codelco", "country": "Chile", "reliability_score": 93, "materials": ["copper"]},
    {"id": "SUP009", "name": "LG Chem", "country": "South Korea", "reliability_score": 92, "materials": ["abs_plastic", "pp_plastic"]},
    {"id": "SUP010", "name": "TSMC", "country": "Taiwan", "reliability_score": 96, "materials": ["semiconductors"]},
]

NEWS_TEMPLATES = [
    {"title": "China Steel Production Cuts Impact Global Prices", "impact": "high", "materials": ["steel_hr", "steel_cr"], "sentiment": "bearish"},
    {"title": "Copper Demand Surges Amid EV Boom", "impact": "high", "materials": ["copper"], "sentiment": "bullish"},
    {"title": "Rubber Plantations Report Record Yields", "impact": "medium", "materials": ["rubber_nr"], "sentiment": "bearish"},
    {"title": "Semiconductor Shortage Easing Globally", "impact": "high", "materials": ["semiconductors", "pcb"], "sentiment": "bullish"},
    {"title": "Aluminium Smelters Face Energy Cost Pressures", "impact": "medium", "materials": ["aluminium"], "sentiment": "bullish"},
    {"title": "Plastic Recycling Regulations Tighten in EU", "impact": "low", "materials": ["abs_plastic", "pp_plastic"], "sentiment": "neutral"},
    {"title": "Geopolitical Tensions Affect Copper Supply Routes", "impact": "high", "materials": ["copper"], "sentiment": "bullish"},
    {"title": "India Increases Steel Export Duties", "impact": "medium", "materials": ["steel_hr", "steel_cr"], "sentiment": "bullish"},
]

def generate_price_with_trend(base_price: float, volatility: float, days_back: int) -> float:
    """Generate price with trend and noise"""
    trend = math.sin(days_back / 30) * 0.05  # Seasonal trend
    noise = random.gauss(0, volatility)
    return base_price * (1 + trend + noise)

def get_current_prices() -> List[MaterialPrice]:
    """Generate current prices for all materials"""
    prices = []
    for mat_id, mat_info in MATERIALS.items():
        base = mat_info["base_price"]
        vol = mat_info["volatility"]
        current = generate_price_with_trend(base, vol, 0)
        price_24h_ago = generate_price_with_trend(base, vol, 1)
        price_7d_ago = generate_price_with_trend(base, vol, 7)
        price_30d_ago = generate_price_with_trend(base, vol, 30)
        
        prices.append(MaterialPrice(
            material_id=mat_id,
            name=mat_info["name"],
            category=mat_info["category"],
            current_price=round(current, 2),
            unit=mat_info["unit"],
            change_24h=round((current - price_24h_ago) / price_24h_ago * 100, 2),
            change_7d=round((current - price_7d_ago) / price_7d_ago * 100, 2),
            change_30d=round((current - price_30d_ago) / price_30d_ago * 100, 2),
            volume_24h=round(random.uniform(50000, 500000), 0),
            high_24h=round(current * 1.02, 2),
            low_24h=round(current * 0.98, 2),
            last_updated=datetime.now(timezone.utc).isoformat()
        ))
    return prices

def get_grade_prices(material_id: str) -> List[Dict]:
    """Generate current prices for all grades of a material"""
    if material_id not in MATERIALS or material_id not in MATERIAL_GRADES:
        return []
    
    mat_info = MATERIALS[material_id]
    grade_info = MATERIAL_GRADES[material_id]
    base = mat_info["base_price"]
    vol = mat_info["volatility"]
    
    grades = []
    for grade in grade_info["grades"]:
        grade_base = base * grade["price_modifier"]
        current = generate_price_with_trend(grade_base, vol, 0)
        price_24h_ago = generate_price_with_trend(grade_base, vol, 1)
        price_7d_ago = generate_price_with_trend(grade_base, vol, 7)
        price_30d_ago = generate_price_with_trend(grade_base, vol, 30)
        
        grades.append({
            "grade_id": grade["id"],
            "material_id": material_id,
            "name": grade["name"],
            "description": grade["description"],
            "current_price": round(current, 2),
            "unit": mat_info["unit"],
            "change_24h": round((current - price_24h_ago) / price_24h_ago * 100, 2),
            "change_7d": round((current - price_7d_ago) / price_7d_ago * 100, 2),
            "change_30d": round((current - price_30d_ago) / price_30d_ago * 100, 2),
            "volume_24h": round(random.uniform(10000, 100000), 0),
            "high_24h": round(current * 1.02, 2),
            "low_24h": round(current * 0.98, 2),
            "price_modifier": grade["price_modifier"],
            "last_updated": datetime.now(timezone.utc).isoformat()
        })
    return grades

def get_grade_price_history(material_id: str, grade_id: str, days: int = 30) -> List[PriceHistoryPoint]:
    """Generate historical price data for a specific grade"""
    if material_id not in MATERIALS or material_id not in MATERIAL_GRADES:
        return []
    
    mat_info = MATERIALS[material_id]
    grade_info = MATERIAL_GRADES[material_id]
    
    # Find the grade
    grade = next((g for g in grade_info["grades"] if g["id"] == grade_id), None)
    if not grade:
        return []
    
    base = mat_info["base_price"] * grade["price_modifier"]
    vol = mat_info["volatility"]
    
    history = []
    for i in range(days, -1, -1):
        dt = datetime.now(timezone.utc) - timedelta(days=i)
        price = generate_price_with_trend(base, vol, i)
        history.append(PriceHistoryPoint(
            timestamp=dt.isoformat(),
            price=round(price, 2),
            volume=round(random.uniform(10000, 50000), 0)
        ))
    return history

def get_grade_forecast(material_id: str, grade_id: str, days: int = 30) -> List[Forecast]:
    """Generate price forecast for a specific grade"""
    if material_id not in MATERIALS or material_id not in MATERIAL_GRADES:
        return []
    
    mat_info = MATERIALS[material_id]
    grade_info = MATERIAL_GRADES[material_id]
    
    # Find the grade
    grade = next((g for g in grade_info["grades"] if g["id"] == grade_id), None)
    if not grade:
        return []
    
    base = mat_info["base_price"] * grade["price_modifier"]
    vol = mat_info["volatility"]
    
    # Start from current price
    current = generate_price_with_trend(base, vol, 0)
    trend = random.choice([-1, 1]) * random.uniform(0.001, 0.003)
    
    forecasts = []
    for i in range(1, days + 1):
        dt = datetime.now(timezone.utc) + timedelta(days=i)
        predicted = current * (1 + trend * i + random.gauss(0, vol * 0.3))
        uncertainty = vol * math.sqrt(i) * current
        confidence = max(0.6, 0.95 - i * 0.01)
        
        forecasts.append(Forecast(
            date=dt.strftime("%Y-%m-%d"),
            predicted_price=round(predicted, 2),
            lower_bound=round(predicted - uncertainty, 2),
            upper_bound=round(predicted + uncertainty, 2),
            confidence=round(confidence, 2)
        ))
    return forecasts

def get_price_history(material_id: str, days: int = 30) -> List[PriceHistoryPoint]:
    """Generate historical price data"""
    if material_id not in MATERIALS:
        return []
    
    mat_info = MATERIALS[material_id]
    base = mat_info["base_price"]
    vol = mat_info["volatility"]
    
    history = []
    for i in range(days, -1, -1):
        dt = datetime.now(timezone.utc) - timedelta(days=i)
        price = generate_price_with_trend(base, vol, i)
        history.append(PriceHistoryPoint(
            timestamp=dt.isoformat(),
            price=round(price, 2),
            volume=round(random.uniform(50000, 200000), 0)
        ))
    return history

def get_forecast(material_id: str, days: int = 30) -> List[Forecast]:
    """Generate price forecast with confidence intervals"""
    if material_id not in MATERIALS:
        return []
    
    mat_info = MATERIALS[material_id]
    base = mat_info["base_price"]
    vol = mat_info["volatility"]
    
    # Start from current price
    current = generate_price_with_trend(base, vol, 0)
    trend = random.choice([-1, 1]) * random.uniform(0.001, 0.003)  # Daily trend
    
    forecasts = []
    for i in range(1, days + 1):
        dt = datetime.now(timezone.utc) + timedelta(days=i)
        predicted = current * (1 + trend * i + random.gauss(0, vol * 0.3))
        uncertainty = vol * math.sqrt(i) * current
        confidence = max(0.6, 0.95 - i * 0.01)
        
        forecasts.append(Forecast(
            date=dt.strftime("%Y-%m-%d"),
            predicted_price=round(predicted, 2),
            lower_bound=round(predicted - uncertainty, 2),
            upper_bound=round(predicted + uncertainty, 2),
            confidence=round(confidence, 2)
        ))
    return forecasts

def get_suppliers_for_material(material_id: str) -> List[SupplierInfo]:
    """Get suppliers for a specific material"""
    suppliers = []
    for sup in SUPPLIERS:
        if material_id in sup["materials"]:
            suppliers.append(SupplierInfo(
                id=sup["id"],
                name=sup["name"],
                country=sup["country"],
                reliability_score=sup["reliability_score"],
                price_competitiveness=round(random.uniform(85, 99), 1),
                lead_time_days=random.randint(7, 30),
                materials=sup["materials"],
                avg_price_deviation=round(random.uniform(-5, 5), 2)
            ))
    return suppliers

def generate_news() -> List[NewsItem]:
    """Generate mock news items"""
    news = []
    for i, template in enumerate(NEWS_TEMPLATES):
        hours_ago = random.randint(1, 48)
        dt = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
        summary = f"Market analysts report significant developments in the {template['materials'][0].replace('_', ' ')} market. " \
                  f"The impact is expected to be {template['impact']} on pricing over the coming weeks."
        
        news.append(NewsItem(
            id=f"NEWS{i+1:03d}",
            title=template["title"],
            summary=summary,
            impact=template["impact"],
            affected_materials=template["materials"],
            source=random.choice(["Bloomberg", "Reuters", "Financial Times", "Metal Bulletin", "Platts"]),
            timestamp=dt.isoformat(),
            sentiment=template["sentiment"]
        ))
    return sorted(news, key=lambda x: x.timestamp, reverse=True)

def calculate_bom_impact(material_changes: Dict[str, float]) -> List[Dict]:
    """Calculate BOM impact based on material price changes"""
    impacts = []
    for component, info in COMPONENT_MAPPING.items():
        component_impact = 0
        material_breakdown = []
        
        for mat_id in info["materials"]:
            if mat_id in MATERIALS:
                mat_info = MATERIALS[mat_id]
                change = material_changes.get(mat_id, 0)
                contribution = random.uniform(0.1, 0.4)  # Material contribution to component cost
                impact = contribution * change
                component_impact += impact
                material_breakdown.append({
                    "material": mat_info["name"],
                    "contribution_pct": round(contribution * 100, 1),
                    "price_change_pct": change,
                    "cost_impact_pct": round(impact, 2)
                })
        
        impacts.append({
            "component": component.replace("_", " ").title(),
            "total_impact_pct": round(component_impact, 2),
            "material_breakdown": material_breakdown,
            "plant_usage": info["plant_usage"]
        })
    return impacts

def get_procurement_recommendations() -> List[Dict]:
    """Generate AI-powered procurement recommendations"""
    recommendations = []
    for mat_id, mat_info in MATERIALS.items():
        forecast = get_forecast(mat_id, 30)
        if forecast:
            avg_forecast = sum(f.predicted_price for f in forecast[:7]) / 7
            current = generate_price_with_trend(mat_info["base_price"], mat_info["volatility"], 0)
            
            if avg_forecast > current * 1.03:
                action = "BUY NOW"
                reason = "Prices expected to rise by {:.1f}% in the next week".format((avg_forecast/current - 1) * 100)
                urgency = "high"
            elif avg_forecast < current * 0.97:
                action = "WAIT"
                reason = "Prices expected to drop by {:.1f}% in the next week".format((1 - avg_forecast/current) * 100)
                urgency = "low"
            else:
                action = "MONITOR"
                reason = "Prices stable, normal procurement schedule recommended"
                urgency = "medium"
            
            # Get best supplier
            suppliers = get_suppliers_for_material(mat_id)
            best_supplier = max(suppliers, key=lambda s: s.reliability_score) if suppliers else None
            
            recommendations.append({
                "material_id": mat_id,
                "material_name": mat_info["name"],
                "current_price": round(current, 2),
                "unit": mat_info["unit"],
                "action": action,
                "reason": reason,
                "urgency": urgency,
                "suggested_quantity": round(random.uniform(100, 1000), 0),
                "best_supplier": best_supplier.name if best_supplier else "N/A",
                "potential_savings_pct": round(random.uniform(2, 8), 1) if action == "BUY NOW" else 0
            })
    return recommendations

def get_cost_drivers() -> Dict:
    """Analyze cost drivers"""
    return {
        "material_costs": {
            "percentage": 65,
            "trend": "increasing",
            "change_30d": round(random.uniform(2, 6), 1)
        },
        "energy_costs": {
            "percentage": 18,
            "trend": "stable",
            "change_30d": round(random.uniform(-1, 2), 1)
        },
        "logistics_costs": {
            "percentage": 12,
            "trend": "decreasing",
            "change_30d": round(random.uniform(-3, 0), 1)
        },
        "labor_costs": {
            "percentage": 5,
            "trend": "stable",
            "change_30d": round(random.uniform(0, 1), 1)
        }
    }

def get_trade_flows() -> List[Dict]:
    """Get import/export data by country"""
    countries = [
        {"code": "CN", "name": "China", "type": "exporter", "volume": 45000000},
        {"code": "IN", "name": "India", "type": "importer", "volume": 28000000},
        {"code": "JP", "name": "Japan", "type": "importer", "volume": 18000000},
        {"code": "DE", "name": "Germany", "type": "exporter", "volume": 22000000},
        {"code": "US", "name": "United States", "type": "importer", "volume": 35000000},
        {"code": "KR", "name": "South Korea", "type": "importer", "volume": 15000000},
        {"code": "BR", "name": "Brazil", "type": "exporter", "volume": 12000000},
        {"code": "AU", "name": "Australia", "type": "exporter", "volume": 30000000},
    ]
    
    return [{
        **c,
        "avg_price_deviation": round(random.uniform(-8, 8), 1),
        "trend": random.choice(["increasing", "decreasing", "stable"])
    } for c in countries]

def get_plant_comparison() -> Dict:
    """Compare plants performance"""
    return {
        "Plant A": {
            "total_material_cost": round(random.uniform(8000000, 10000000), 0),
            "cost_per_unit": round(random.uniform(450, 500), 2),
            "efficiency_score": round(random.uniform(85, 95), 1),
            "inventory_days": random.randint(12, 18),
            "material_waste_pct": round(random.uniform(2, 4), 1)
        },
        "Plant B": {
            "total_material_cost": round(random.uniform(7000000, 9000000), 0),
            "cost_per_unit": round(random.uniform(420, 480), 2),
            "efficiency_score": round(random.uniform(80, 92), 1),
            "inventory_days": random.randint(14, 20),
            "material_waste_pct": round(random.uniform(2.5, 5), 1)
        }
    }

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "RMIE - Raw Material Intelligence Engine API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Currency endpoints
@api_router.get("/currency/rates")
async def get_currency_rates():
    """Get available currency exchange rates"""
    return {
        "rates": EXCHANGE_RATES,
        "available_currencies": ["USD", "INR", "EUR", "GBP"],
        "default": "USD"
    }

@api_router.get("/currency/convert")
async def convert_price(amount: float, from_curr: str = "USD", to_curr: str = "INR"):
    """Convert amount between currencies"""
    converted = convert_currency(amount, from_curr.upper(), to_curr.upper())
    return {
        "original": {"amount": amount, "currency": from_curr},
        "converted": {"amount": round(converted, 2), "currency": to_curr},
        "rate": EXCHANGE_RATES.get(f"{from_curr}_{to_curr}", 1)
    }

# Material Prices
@api_router.get("/materials/prices")
async def get_material_prices(currency: str = "USD"):
    """Get current prices for all materials"""
    prices = get_current_prices()
    if currency.upper() != "USD":
        for p in prices:
            rate = EXCHANGE_RATES.get(f"USD_{currency.upper()}", 1)
            p.current_price = round(p.current_price * rate, 2)
            p.high_24h = round(p.high_24h * rate, 2)
            p.low_24h = round(p.low_24h * rate, 2)
            p.currency = currency.upper()
    return {"materials": prices, "currency": currency.upper()}

@api_router.get("/materials/{material_id}/price")
async def get_material_price(material_id: str):
    """Get current price for a specific material"""
    prices = get_current_prices()
    for p in prices:
        if p.material_id == material_id:
            return p
    raise HTTPException(status_code=404, detail="Material not found")

@api_router.get("/materials/{material_id}/history")
async def get_material_history(material_id: str, days: int = Query(30, ge=1, le=365)):
    """Get price history for a material"""
    history = get_price_history(material_id, days)
    if not history:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"material_id": material_id, "history": history}

@api_router.get("/materials/{material_id}/forecast")
async def get_material_forecast(material_id: str, days: int = Query(30, ge=1, le=90)):
    """Get price forecast for a material"""
    forecast = get_forecast(material_id, days)
    if not forecast:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"material_id": material_id, "forecasts": forecast}

# Grade endpoints
@api_router.get("/materials/{material_id}/grades")
async def get_material_grades(material_id: str, currency: str = "USD"):
    """Get all grades for a material with current prices"""
    if material_id not in MATERIAL_GRADES:
        raise HTTPException(status_code=404, detail="Material not found")
    
    grades = get_grade_prices(material_id)
    material_info = MATERIAL_GRADES[material_id]
    
    if currency.upper() != "USD":
        rate = EXCHANGE_RATES.get(f"USD_{currency.upper()}", 1)
        for g in grades:
            g["current_price"] = round(g["current_price"] * rate, 2)
            g["high_24h"] = round(g["high_24h"] * rate, 2)
            g["low_24h"] = round(g["low_24h"] * rate, 2)
    
    return {
        "material_id": material_id,
        "material_name": material_info["name"],
        "grades": grades,
        "currency": currency.upper()
    }

@api_router.get("/materials/{material_id}/grades/{grade_id}")
async def get_grade_detail(material_id: str, grade_id: str, currency: str = "USD"):
    """Get details for a specific grade"""
    grades = get_grade_prices(material_id)
    grade = next((g for g in grades if g["grade_id"] == grade_id), None)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    if currency.upper() != "USD":
        rate = EXCHANGE_RATES.get(f"USD_{currency.upper()}", 1)
        grade["current_price"] = round(grade["current_price"] * rate, 2)
        grade["high_24h"] = round(grade["high_24h"] * rate, 2)
        grade["low_24h"] = round(grade["low_24h"] * rate, 2)
    
    return {"grade": grade, "currency": currency.upper()}

@api_router.get("/materials/{material_id}/grades/{grade_id}/history")
async def get_grade_history_endpoint(material_id: str, grade_id: str, days: int = Query(30, ge=1, le=365)):
    """Get price history for a specific grade"""
    history = get_grade_price_history(material_id, grade_id, days)
    if not history:
        raise HTTPException(status_code=404, detail="Grade not found")
    return {"material_id": material_id, "grade_id": grade_id, "history": history}

@api_router.get("/materials/{material_id}/grades/{grade_id}/forecast")
async def get_grade_forecast_endpoint(material_id: str, grade_id: str, days: int = Query(30, ge=1, le=90)):
    """Get price forecast for a specific grade"""
    forecast = get_grade_forecast(material_id, grade_id, days)
    if not forecast:
        raise HTTPException(status_code=404, detail="Grade not found")
    return {"material_id": material_id, "grade_id": grade_id, "forecasts": forecast}

@api_router.get("/materials/categories")
async def get_material_categories():
    """Get all material categories"""
    categories = {}
    for mat_id, mat_info in MATERIALS.items():
        cat = mat_info["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({"id": mat_id, "name": mat_info["name"]})
    return {"categories": categories}

# Suppliers
@api_router.get("/suppliers")
async def get_all_suppliers():
    """Get all suppliers"""
    all_suppliers = []
    for sup in SUPPLIERS:
        all_suppliers.append(SupplierInfo(
            id=sup["id"],
            name=sup["name"],
            country=sup["country"],
            reliability_score=sup["reliability_score"],
            price_competitiveness=round(random.uniform(85, 99), 1),
            lead_time_days=random.randint(7, 30),
            materials=sup["materials"],
            avg_price_deviation=round(random.uniform(-5, 5), 2)
        ))
    return {"suppliers": all_suppliers}

@api_router.get("/suppliers/{material_id}")
async def get_material_suppliers(material_id: str):
    """Get suppliers for a specific material"""
    suppliers = get_suppliers_for_material(material_id)
    return {"material_id": material_id, "suppliers": suppliers}

# BOM Impact
@api_router.post("/bom/impact")
async def calculate_bom(material_changes: Dict[str, float]):
    """Calculate BOM impact based on material price changes"""
    impacts = calculate_bom_impact(material_changes)
    return {"impacts": impacts}

@api_router.get("/bom/components")
async def get_bom_components():
    """Get all BOM components and their material mapping"""
    components = []
    for comp, info in COMPONENT_MAPPING.items():
        materials = []
        for mat_id in info["materials"]:
            if mat_id in MATERIALS:
                materials.append({"id": mat_id, "name": MATERIALS[mat_id]["name"]})
        components.append({
            "id": comp,
            "name": comp.replace("_", " ").title(),
            "materials": materials,
            "plant_usage": info["plant_usage"]
        })
    return {"components": components}

# Procurement Recommendations
@api_router.get("/procurement/recommendations")
async def get_recommendations():
    """Get AI-powered procurement recommendations"""
    return {"recommendations": get_procurement_recommendations()}

# News & Insights
@api_router.get("/news")
async def get_news():
    """Get market news and insights - returns mock data as fallback"""
    return {"news": generate_news(), "source": "mock"}

@api_router.get("/news/live")
async def get_live_news():
    """Get live news from Alpha Vantage API"""
    if not ALPHA_VANTAGE_KEY:
        return {"news": generate_news(), "source": "mock", "error": "API key not configured"}
    
    try:
        import aiohttp
        # Fetch commodity/materials related news
        topics = "manufacturing,technology,energy_transportation"
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics={topics}&apikey={ALPHA_VANTAGE_KEY}&limit=20"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if "feed" in data:
                        news_items = []
                        for item in data["feed"][:15]:
                            # Map sentiment to our format
                            sentiment_score = float(item.get("overall_sentiment_score", 0))
                            if sentiment_score > 0.15:
                                sentiment = "bullish"
                            elif sentiment_score < -0.15:
                                sentiment = "bearish"
                            else:
                                sentiment = "neutral"
                            
                            # Determine impact based on relevance
                            relevance = float(item.get("relevance_score", "0.5") or 0.5)
                            if relevance > 0.7:
                                impact = "high"
                            elif relevance > 0.4:
                                impact = "medium"
                            else:
                                impact = "low"
                            
                            # Extract ticker relevance for materials mapping
                            affected_materials = []
                            ticker_sentiment = item.get("ticker_sentiment", [])
                            for ticker in ticker_sentiment[:3]:
                                affected_materials.append(ticker.get("ticker", ""))
                            
                            news_items.append({
                                "id": item.get("url", "")[:50],
                                "title": item.get("title", ""),
                                "summary": item.get("summary", "")[:300] + "..." if len(item.get("summary", "")) > 300 else item.get("summary", ""),
                                "url": item.get("url", ""),
                                "source": item.get("source", ""),
                                "timestamp": item.get("time_published", ""),
                                "sentiment": sentiment,
                                "sentiment_score": round(sentiment_score, 3),
                                "impact": impact,
                                "affected_materials": affected_materials if affected_materials else ["general"],
                                "banner_image": item.get("banner_image", ""),
                                "topics": [t.get("topic", "") for t in item.get("topics", [])][:3]
                            })
                        
                        return {"news": news_items, "source": "alpha_vantage", "count": len(news_items)}
                    else:
                        # API limit reached or error
                        return {"news": generate_news(), "source": "mock", "note": "API limit reached, showing mock data"}
                else:
                    return {"news": generate_news(), "source": "mock", "error": f"API returned {response.status}"}
    except Exception as e:
        logger.error(f"Error fetching live news: {e}")
        return {"news": generate_news(), "source": "mock", "error": str(e)}

# Cost Drivers
@api_router.get("/analysis/cost-drivers")
async def get_cost_driver_analysis():
    """Get cost driver analysis"""
    return {"cost_drivers": get_cost_drivers()}

# Trade Flows
@api_router.get("/analysis/trade-flows")
async def get_trade_flow_data():
    """Get global trade flow data"""
    return {"trade_flows": get_trade_flows()}

# Plant Comparison
@api_router.get("/analysis/plants")
async def get_plant_data():
    """Get plant comparison data"""
    return {"plants": get_plant_comparison()}

# Alerts
@api_router.get("/alerts")
async def get_alerts():
    """Get all configured alerts"""
    alerts = await db.alerts.find({}, {"_id": 0}).to_list(100)
    return {"alerts": alerts}

@api_router.post("/alerts")
async def create_alert(alert: Dict):
    """Create a new price alert"""
    alert_doc = {
        "id": str(uuid.uuid4()),
        "material": alert.get("material"),
        "alert_type": alert.get("alert_type", "threshold"),
        "threshold": alert.get("threshold"),
        "enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.alerts.insert_one(alert_doc)
    return {"message": "Alert created", "alert": {k: v for k, v in alert_doc.items() if k != "_id"}}

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    result = await db.alerts.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}

# Control Tower Summary
@api_router.get("/control-tower")
async def get_control_tower_data():
    """Get control tower summary data"""
    prices = get_current_prices()
    recommendations = get_procurement_recommendations()
    news = generate_news()[:5]
    
    # Calculate risk alerts
    risk_alerts = []
    for p in prices:
        if abs(p.change_24h) > 3:
            risk_alerts.append({
                "material": p.name,
                "type": "price_spike" if p.change_24h > 0 else "price_drop",
                "change": p.change_24h,
                "severity": "high" if abs(p.change_24h) > 5 else "medium"
            })
    
    # Top movers
    sorted_prices = sorted(prices, key=lambda x: abs(x.change_24h), reverse=True)
    
    return {
        "summary": {
            "total_materials": len(MATERIALS),
            "active_alerts": len(risk_alerts),
            "buy_now_recommendations": len([r for r in recommendations if r["action"] == "BUY NOW"]),
            "potential_savings": sum(r.get("potential_savings_pct", 0) for r in recommendations if r["action"] == "BUY NOW")
        },
        "top_movers": sorted_prices[:5],
        "risk_alerts": risk_alerts,
        "news_highlights": news,
        "quick_recommendations": [r for r in recommendations if r["urgency"] == "high"][:3]
    }

# AI Chat
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with AI about raw materials"""
    session_id = request.session_id or str(uuid.uuid4())
    
    # Build context about current market conditions
    prices = get_current_prices()
    price_context = "\n".join([f"- {p.name}: ${p.current_price}/{p.unit} (24h: {p.change_24h:+.2f}%)" for p in prices[:5]])
    
    system_message = f"""You are an expert AI assistant for the Raw Material Intelligence Engine (RMIE).
You help procurement teams, finance teams, and plant managers understand raw material markets.

Current Market Data:
{price_context}

You can answer questions about:
- Material prices and trends
- Procurement strategies
- Supplier selection
- Cost optimization
- Market forecasts
- Risk analysis

Be concise, data-driven, and provide actionable insights. Use numbers when relevant."""

    try:
        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model(LLM_PROVIDER, LLM_MODEL)
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Store chat history
        await db.chat_history.insert_one({
            "session_id": session_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        await db.chat_history.insert_one({
            "session_id": session_id,
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            response="I apologize, but I'm having trouble connecting to the AI service. Please try again later.",
            session_id=session_id
        )

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    history = await db.chat_history.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return {"history": history}

# LLM Configuration
@api_router.get("/config/llm")
async def get_llm_config():
    """Get current LLM configuration"""
    return {
        "provider": LLM_PROVIDER,
        "model": LLM_MODEL,
        "available_providers": {
            "openai": ["gpt-5.2", "gpt-4o", "gpt-4.1"],
            "anthropic": ["claude-sonnet-4-5-20250929", "claude-4-sonnet-20250514"],
            "gemini": ["gemini-3-flash-preview", "gemini-2.5-pro"]
        }
    }

@api_router.post("/config/llm")
async def update_llm_config(config: LLMConfigUpdate):
    """Update LLM configuration"""
    global LLM_PROVIDER, LLM_MODEL
    LLM_PROVIDER = config.provider
    LLM_MODEL = config.model
    return {"message": "LLM configuration updated", "provider": LLM_PROVIDER, "model": LLM_MODEL}

# What-If Simulation
@api_router.post("/simulation/what-if")
async def what_if_simulation(scenario: Dict):
    """Run what-if simulation"""
    material_id = scenario.get("material_id")
    price_change_pct = scenario.get("price_change_pct", 0)
    
    if material_id not in MATERIALS:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Calculate impacts
    material_changes = {material_id: price_change_pct}
    impacts = calculate_bom_impact(material_changes)
    
    # Get affected components
    affected_components = [i for i in impacts if any(m["material"] == MATERIALS[material_id]["name"] for m in i["material_breakdown"])]
    
    total_cost_impact = sum(i["total_impact_pct"] for i in affected_components)
    
    return {
        "scenario": {
            "material": MATERIALS[material_id]["name"],
            "price_change_pct": price_change_pct
        },
        "impact_summary": {
            "affected_components": len(affected_components),
            "avg_cost_impact_pct": round(total_cost_impact / len(affected_components) if affected_components else 0, 2),
            "total_annual_impact_usd": round(abs(total_cost_impact) * random.uniform(50000, 200000), 0)
        },
        "component_impacts": affected_components,
        "recommendation": "Consider hedging or alternative suppliers" if price_change_pct > 5 else "Monitor situation"
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
