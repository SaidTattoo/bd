#!/usr/bin/env python3
"""
Script de diagnóstico para comparación de huellas
Ayuda a identificar problemas en el flujo de comparación
"""

import requests
import base64
import json
import time
from datetime import datetime

class FingerprintDebugger:
    def __init__(self):
        self.python_driver_url = 'http://localhost:5000'
        self.backend_url = 'http://localhost:3000'
        
    def test_capture(self):
        """Probar captura de huella"""
        print("=== TEST CAPTURA DE HUELLA ===")
        try:
            response = requests.post(f"{self.python_driver_url}/capturar-huella", 
                                   json={
                                       "save_image": False,
                                       "create_template": True,
                                       "template_id": f"test_{int(time.time())}"
                                   },
                                   timeout=15)
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Template length: {len(data.get('template', ''))}")
                print(f"Success: {data.get('success')}")
                return data.get('template')
            else:
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error en captura: {e}")
            return None
    
    def test_comparison_levels(self, template1, template2=None):
        """Probar comparación con diferentes niveles de seguridad"""
        print("\n=== TEST COMPARACIÓN POR NIVELES ===")
        
        if template2 is None:
            template2 = template1  # Comparar consigo misma
            
        results = []
        
        for level in [1, 3, 5, 7, 9]:
            print(f"\n--- Nivel {level} ---")
            try:
                response = requests.post(f"{self.python_driver_url}/comparar-huellas", 
                                       json={
                                           "template1_data": template1,
                                           "template2_data": template2,
                                           "security_level": level
                                       },
                                       timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    result = {
                        'level': level,
                        'matched': data.get('matched'),
                        'score': data.get('score'),
                        'message': data.get('message'),
                        'success': data.get('success')
                    }
                    results.append(result)
                    print(f"  Match: {result['matched']}")
                    print(f"  Score: {result['score']}")
                    print(f"  Message: {result['message']}")
                else:
                    print(f"  Error HTTP: {response.status_code}")
                    print(f"  Response: {response.text}")
                    
            except Exception as e:
                print(f"  Error: {e}")
                
        return results
    
    def test_template_validation(self, template):
        """Validar formato del template"""
        print("\n=== TEST VALIDACIÓN TEMPLATE ===")
        
        try:
            # Verificar que sea base64 válido
            decoded = base64.b64decode(template)
            print(f"Template válido en base64: SÍ")
            print(f"Longitud original: {len(template)}")
            print(f"Longitud decodificada: {len(decoded)}")
            
            # Verificar header del template
            if len(decoded) >= 8:
                header = decoded[:8]
                print(f"Header (hex): {header.hex()}")
                
                # Verificar si tiene la estructura esperada
                if b'SGFP' in header:
                    print("Estructura SGFP encontrada: SÍ")
                else:
                    print("Estructura SGFP encontrada: NO")
                    
            return True
            
        except Exception as e:
            print(f"Error en validación: {e}")
            return False
    
    def test_backend_flow(self, template):
        """Probar flujo completo del backend"""
        print("\n=== TEST FLUJO BACKEND ===")
        
        try:
            # Simular llamada del frontend al backend
            response = requests.post(f"{self.backend_url}/auth/find-user-by-fingerprint",
                                   json={"template": template},
                                   timeout=15)
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Usuario encontrado: {data.get('user', {}).get('nombre', 'N/A')}")
                return True
            elif response.status_code == 404:
                print("No se encontró usuario con esa huella")
                return False
            else:
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error en flujo backend: {e}")
            return False
    
    def run_full_diagnostic(self):
        """Ejecutar diagnóstico completo"""
        print(f"=== DIAGNÓSTICO COMPLETO - {datetime.now()} ===")
        
        # 1. Capturar huella
        template = self.test_capture()
        if not template:
            print("FALLO: No se pudo capturar huella")
            return
        
        # 2. Validar template
        if not self.test_template_validation(template):
            print("FALLO: Template inválido")
            return
        
        # 3. Probar comparación por niveles
        comparison_results = self.test_comparison_levels(template)
        
        # 4. Probar flujo backend
        backend_success = self.test_backend_flow(template)
        
        # 5. Resumen
        print("\n=== RESUMEN ===")
        print(f"Captura exitosa: {'SÍ' if template else 'NO'}")
        print(f"Template válido: {'SÍ' if template else 'NO'}")
        print(f"Niveles que funcionan: {[r['level'] for r in comparison_results if r['matched']]}")
        print(f"Backend funciona: {'SÍ' if backend_success else 'NO'}")
        
        # 6. Recomendaciones
        print("\n=== RECOMENDACIONES ===")
        working_levels = [r for r in comparison_results if r['matched']]
        
        if not working_levels:
            print("❌ PROBLEMA: Ningún nivel de seguridad funciona")
            print("   - Verificar que el dispositivo esté conectado")
            print("   - Verificar que el SDK esté instalado correctamente")
            print("   - Probar con diferentes dedos")
        else:
            best_level = min(working_levels, key=lambda x: x['level'])
            print(f"✅ RECOMENDACIÓN: Usar security_level = {best_level['level']}")
            print(f"   Score obtenido: {best_level['score']}")
            print(f"   Mensaje: {best_level['message']}")

if __name__ == "__main__":
    debugger = FingerprintDebugger()
    debugger.run_full_diagnostic() 