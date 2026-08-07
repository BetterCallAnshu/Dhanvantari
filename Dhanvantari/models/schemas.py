"""
Public Health Signal Fusion Agent - CSV & Data Schemas
Defines headers and structure for synthetic generator & Kaggle dataset loaders.
"""

from typing import Dict, List

# CSV Header definitions for Kaggle and Synthetic datasets
CENSUS_CSV_HEADERS: List[str] = [
    "District",
    "State",
    "Population",
    "Population_Density_Per_Sq_Km",
    "Urbanization_Rate_Percent",
    "Literacy_Rate_Percent"
]

HOSPITALS_CSV_HEADERS: List[str] = [
    "District",
    "Total_Hospitals",
    "Government_Hospitals",
    "Private_Hospitals",
    "Total_Beds",
    "ICU_Beds",
    "Beds_Per_1000_Pop"
]

SYNTHETIC_HOSPITAL_CSV_HEADERS: List[str] = [
    "timestamp",
    "district",
    "scenario_name",
    "total_admissions_24h",
    "fever_ipd_admissions",
    "icu_occupancy_percent",
    "pediatric_surge_index"
]

SYNTHETIC_PHARMACY_CSV_HEADERS: List[str] = [
    "timestamp",
    "district",
    "scenario_name",
    "ors_sales_surge_percent",
    "paracetamol_sales_surge_percent",
    "antibiotic_sales_surge_percent"
]

SYNTHETIC_DISEASE_CSV_HEADERS: List[str] = [
    "timestamp",
    "district",
    "scenario_name",
    "disease_name",
    "reported_cases_count",
    "confirmed_cases_count",
    "suspected_clusters"
]
