"""Scrapers package for Cultura Transparente"""
from backend.scrapers.rouanet_scraper import RouanetScraper
from backend.scrapers.fac_scraper import FacScraper
from backend.scrapers.viamao_scraper import ViamaoCultureScraper

__all__ = ["RouanetScraper", "FacScraper", "ViamaoCultureScraper"]
