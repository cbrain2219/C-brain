-- Snapshot of the initial spreadsheet-backed product catalog.
-- Safe to rerun: existing administrator-managed products are never overwritten.

begin;

with variant_seed as (
  select *
  from jsonb_to_recordset(
$variants$
[
  {
    "product_type": "브로슈어 · 카탈로그",
    "product_subtype": "",
    "status": "draft",
    "sort_order": 1,
    "configuration": {
      "optionValues": {
        "pageCount": [
          "8",
          "12",
          "16"
        ],
        "paper": [
          "일반지(스노우지)",
          "고급지(랑데뷰)"
        ],
        "thickness": [
          "얇은",
          "보통",
          "두꺼운"
        ],
        "coverCoating": [
          "무광",
          "유광"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 2100
          },
          {
            "quantity": 200,
            "unitPrice": 1850
          },
          {
            "quantity": 300,
            "unitPrice": 1633
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 2100
          },
          {
            "quantity": 200,
            "unitPrice": 1850
          },
          {
            "quantity": 300,
            "unitPrice": 1633
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 2800
          },
          {
            "quantity": 200,
            "unitPrice": 2400
          },
          {
            "quantity": 300,
            "unitPrice": 2200
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 2800
          },
          {
            "quantity": 200,
            "unitPrice": 2400
          },
          {
            "quantity": 300,
            "unitPrice": 2200
          }
        ],
        "2:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 3300
          },
          {
            "quantity": 200,
            "unitPrice": 2950
          },
          {
            "quantity": 300,
            "unitPrice": 2100
          }
        ],
        "2:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 3300
          },
          {
            "quantity": 200,
            "unitPrice": 2950
          },
          {
            "quantity": 300,
            "unitPrice": 2100
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 2200
          },
          {
            "quantity": 200,
            "unitPrice": 1900
          },
          {
            "quantity": 300,
            "unitPrice": 1667
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 2200
          },
          {
            "quantity": 200,
            "unitPrice": 1900
          },
          {
            "quantity": 300,
            "unitPrice": 1667
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 2900
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 300,
            "unitPrice": 2233
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 2900
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 300,
            "unitPrice": 2233
          }
        ],
        "2:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3100
          },
          {
            "quantity": 300,
            "unitPrice": 2200
          }
        ],
        "2:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3100
          },
          {
            "quantity": 300,
            "unitPrice": 2200
          }
        ],
        "0:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 2200
          },
          {
            "quantity": 200,
            "unitPrice": 1950
          },
          {
            "quantity": 300,
            "unitPrice": 1733
          }
        ],
        "0:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 2200
          },
          {
            "quantity": 200,
            "unitPrice": 1950
          },
          {
            "quantity": 300,
            "unitPrice": 1733
          }
        ],
        "1:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 2900
          },
          {
            "quantity": 200,
            "unitPrice": 2550
          },
          {
            "quantity": 300,
            "unitPrice": 2333
          }
        ],
        "1:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 2900
          },
          {
            "quantity": 200,
            "unitPrice": 2550
          },
          {
            "quantity": 300,
            "unitPrice": 2333
          }
        ],
        "2:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3100
          },
          {
            "quantity": 300,
            "unitPrice": 2400
          }
        ],
        "2:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3100
          },
          {
            "quantity": 300,
            "unitPrice": 2400
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 2400
          },
          {
            "quantity": 200,
            "unitPrice": 2100
          },
          {
            "quantity": 300,
            "unitPrice": 1900
          }
        ],
        "0:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 2400
          },
          {
            "quantity": 200,
            "unitPrice": 2100
          },
          {
            "quantity": 300,
            "unitPrice": 1900
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 3200
          },
          {
            "quantity": 200,
            "unitPrice": 2750
          },
          {
            "quantity": 300,
            "unitPrice": 2533
          }
        ],
        "1:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 3200
          },
          {
            "quantity": 200,
            "unitPrice": 2750
          },
          {
            "quantity": 300,
            "unitPrice": 2533
          }
        ],
        "2:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 3700
          },
          {
            "quantity": 200,
            "unitPrice": 3400
          },
          {
            "quantity": 300,
            "unitPrice": 2700
          }
        ],
        "2:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 3700
          },
          {
            "quantity": 200,
            "unitPrice": 3400
          },
          {
            "quantity": 300,
            "unitPrice": 2700
          }
        ],
        "0:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 2500
          },
          {
            "quantity": 200,
            "unitPrice": 2200
          },
          {
            "quantity": 300,
            "unitPrice": 1967
          }
        ],
        "0:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 2500
          },
          {
            "quantity": 200,
            "unitPrice": 2200
          },
          {
            "quantity": 300,
            "unitPrice": 1967
          }
        ],
        "1:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3300
          },
          {
            "quantity": 200,
            "unitPrice": 2900
          },
          {
            "quantity": 300,
            "unitPrice": 2667
          }
        ],
        "1:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3300
          },
          {
            "quantity": 200,
            "unitPrice": 2900
          },
          {
            "quantity": 300,
            "unitPrice": 2667
          }
        ],
        "2:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3900
          },
          {
            "quantity": 200,
            "unitPrice": 3550
          },
          {
            "quantity": 300,
            "unitPrice": 2900
          }
        ],
        "2:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3900
          },
          {
            "quantity": 200,
            "unitPrice": 3550
          },
          {
            "quantity": 300,
            "unitPrice": 2900
          }
        ],
        "0:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 2600
          },
          {
            "quantity": 200,
            "unitPrice": 2300
          },
          {
            "quantity": 300,
            "unitPrice": 2067
          }
        ],
        "0:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 2600
          },
          {
            "quantity": 200,
            "unitPrice": 2300
          },
          {
            "quantity": 300,
            "unitPrice": 2067
          }
        ],
        "1:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3000
          },
          {
            "quantity": 300,
            "unitPrice": 2767
          }
        ],
        "1:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 3400
          },
          {
            "quantity": 200,
            "unitPrice": 3000
          },
          {
            "quantity": 300,
            "unitPrice": 2767
          }
        ],
        "2:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 4000
          },
          {
            "quantity": 200,
            "unitPrice": 3650
          },
          {
            "quantity": 300,
            "unitPrice": 3200
          }
        ],
        "2:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 4000
          },
          {
            "quantity": 200,
            "unitPrice": 3650
          },
          {
            "quantity": 300,
            "unitPrice": 3200
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "리플렛 · 팜플렛",
    "product_subtype": "",
    "status": "draft",
    "sort_order": 2,
    "configuration": {
      "optionValues": {
        "size": [
          "국3절(620x297mm)",
          "A3(420x297mm)",
          "A4(297x210mm)"
        ],
        "paper": [
          "일반지(스노우지)",
          "고급지(랑데뷰)"
        ],
        "thickness": [
          "얇은",
          "보통",
          "두꺼운"
        ],
        "coverCoating": [
          "무광",
          "유광"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 750,
            "unitPrice": 720
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 750,
            "unitPrice": 720
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 750,
            "unitPrice": 747
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2450
          },
          {
            "quantity": 750,
            "unitPrice": 747
          }
        ],
        "0:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 3100
          },
          {
            "quantity": 200,
            "unitPrice": 2500
          },
          {
            "quantity": 750,
            "unitPrice": 800
          }
        ],
        "0:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 3100
          },
          {
            "quantity": 200,
            "unitPrice": 2500
          },
          {
            "quantity": 750,
            "unitPrice": 800
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2600
          },
          {
            "quantity": 750,
            "unitPrice": 1000
          }
        ],
        "0:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 200,
            "unitPrice": 2600
          },
          {
            "quantity": 750,
            "unitPrice": 1000
          }
        ],
        "0:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3200
          },
          {
            "quantity": 200,
            "unitPrice": 2700
          },
          {
            "quantity": 750,
            "unitPrice": 1027
          }
        ],
        "0:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3200
          },
          {
            "quantity": 200,
            "unitPrice": 2700
          },
          {
            "quantity": 750,
            "unitPrice": 1027
          }
        ],
        "0:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 3600
          },
          {
            "quantity": 200,
            "unitPrice": 2900
          },
          {
            "quantity": 750,
            "unitPrice": 1080
          }
        ],
        "0:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 3600
          },
          {
            "quantity": 200,
            "unitPrice": 2900
          },
          {
            "quantity": 750,
            "unitPrice": 1080
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1033
          },
          {
            "quantity": 500,
            "unitPrice": 860
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1033
          },
          {
            "quantity": 500,
            "unitPrice": 860
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1033
          },
          {
            "quantity": 500,
            "unitPrice": 900
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1033
          },
          {
            "quantity": 500,
            "unitPrice": 900
          }
        ],
        "1:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1067
          },
          {
            "quantity": 500,
            "unitPrice": 940
          }
        ],
        "1:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1600
          },
          {
            "quantity": 300,
            "unitPrice": 1067
          },
          {
            "quantity": 500,
            "unitPrice": 940
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 900
          },
          {
            "quantity": 500,
            "unitPrice": 1060
          }
        ],
        "1:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 900
          },
          {
            "quantity": 500,
            "unitPrice": 1060
          }
        ],
        "1:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 1233
          },
          {
            "quantity": 500,
            "unitPrice": 1100
          }
        ],
        "1:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 1233
          },
          {
            "quantity": 500,
            "unitPrice": 1100
          }
        ],
        "1:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 1200
          },
          {
            "quantity": 500,
            "unitPrice": 1060
          }
        ],
        "1:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1800
          },
          {
            "quantity": 300,
            "unitPrice": 1200
          },
          {
            "quantity": 500,
            "unitPrice": 1060
          }
        ],
        "2:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 560
          },
          {
            "quantity": 1000,
            "unitPrice": 430
          }
        ],
        "2:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 560
          },
          {
            "quantity": 1000,
            "unitPrice": 430
          }
        ],
        "2:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 560
          },
          {
            "quantity": 1000,
            "unitPrice": 450
          }
        ],
        "2:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 560
          },
          {
            "quantity": 1000,
            "unitPrice": 450
          }
        ],
        "2:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 580
          },
          {
            "quantity": 1000,
            "unitPrice": 470
          }
        ],
        "2:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1300
          },
          {
            "quantity": 500,
            "unitPrice": 580
          },
          {
            "quantity": 1000,
            "unitPrice": 470
          }
        ],
        "2:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 640
          },
          {
            "quantity": 1000,
            "unitPrice": 540
          }
        ],
        "2:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 640
          },
          {
            "quantity": 1000,
            "unitPrice": 540
          }
        ],
        "2:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 660
          },
          {
            "quantity": 1000,
            "unitPrice": 550
          }
        ],
        "2:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 660
          },
          {
            "quantity": 1000,
            "unitPrice": 550
          }
        ],
        "2:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 640
          },
          {
            "quantity": 1000,
            "unitPrice": 540
          }
        ],
        "2:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1400
          },
          {
            "quantity": 500,
            "unitPrice": 640
          },
          {
            "quantity": 1000,
            "unitPrice": 540
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "0": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        },
        "1": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        },
        "2": {
          "designPrintEstimate": 40000,
          "planningEstimate": 30000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "포스터 · 전단지",
    "product_subtype": "포스터",
    "status": "draft",
    "sort_order": 3,
    "configuration": {
      "optionValues": {
        "size": [
          "A1(594x841mm)",
          "A2(420x594mm)"
        ],
        "paper": [
          "일반지(아트지)"
        ],
        "thickness": [
          "얇은",
          "두꺼운"
        ],
        "coating": [
          "무광",
          "유광"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 2700
          },
          {
            "quantity": 300,
            "unitPrice": 1133
          },
          {
            "quantity": 500,
            "unitPrice": 800
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 2700
          },
          {
            "quantity": 300,
            "unitPrice": 1133
          },
          {
            "quantity": 500,
            "unitPrice": 800
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 300,
            "unitPrice": 1367
          },
          {
            "quantity": 500,
            "unitPrice": 980
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 3000
          },
          {
            "quantity": 300,
            "unitPrice": 1367
          },
          {
            "quantity": 500,
            "unitPrice": 980
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1900
          },
          {
            "quantity": 300,
            "unitPrice": 967
          },
          {
            "quantity": 500,
            "unitPrice": 620
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1900
          },
          {
            "quantity": 300,
            "unitPrice": 967
          },
          {
            "quantity": 500,
            "unitPrice": 620
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 2000
          },
          {
            "quantity": 300,
            "unitPrice": 1067
          },
          {
            "quantity": 500,
            "unitPrice": 720
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 2000
          },
          {
            "quantity": 300,
            "unitPrice": 1067
          },
          {
            "quantity": 500,
            "unitPrice": 720
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 250000,
          "planningEstimate": 200000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "포스터 · 전단지",
    "product_subtype": "전단지",
    "status": "draft",
    "sort_order": 4,
    "configuration": {
      "optionValues": {
        "size": [
          "A4(210x297mm)"
        ],
        "paper": [
          "일반지(아트지)"
        ],
        "thickness": [
          "얇은",
          "두꺼운"
        ],
        "side": [
          "단면",
          "양면"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 300
          },
          {
            "quantity": 300,
            "unitPrice": 200
          },
          {
            "quantity": 4000,
            "unitPrice": 22
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 400
          },
          {
            "quantity": 300,
            "unitPrice": 333
          },
          {
            "quantity": 4000,
            "unitPrice": 28
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 300
          },
          {
            "quantity": 300,
            "unitPrice": 233
          },
          {
            "quantity": 4000,
            "unitPrice": 48
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 500
          },
          {
            "quantity": 300,
            "unitPrice": 367
          },
          {
            "quantity": 4000,
            "unitPrice": 52
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "0": {
          "designPrintEstimate": 100000,
          "planningEstimate": 60000
        },
        "1": {
          "designPrintEstimate": 75000,
          "planningEstimate": 40000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "배너 · 족자 · 현수막",
    "product_subtype": "배너",
    "status": "draft",
    "sort_order": 5,
    "configuration": {
      "optionValues": {
        "size": [
          "600x1800mm"
        ],
        "stand": [
          "실내용",
          "실외용(물통포함)"
        ],
        "material": [
          "패트지"
        ],
        "side": [
          "단면"
        ],
        "coating": [
          "무광"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 30000
          }
        ],
        "0:1:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 50000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "배너 · 족자 · 현수막",
    "product_subtype": "족자",
    "status": "draft",
    "sort_order": 6,
    "configuration": {
      "optionValues": {
        "size": [
          "900x1500mm",
          "900x2300mm"
        ],
        "material": [
          "현수막천",
          "패트지(무광코팅)"
        ],
        "rod": [
          "원형족자봉(상, 하)"
        ],
        "hookCount": [
          "2"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 50000
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 1,
            "unitPrice": 60000
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 50000
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 1,
            "unitPrice": 80000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "배너 · 족자 · 현수막",
    "product_subtype": "현수막",
    "status": "draft",
    "sort_order": 7,
    "configuration": {
      "optionValues": {
        "size": [
          "5000x900mm"
        ],
        "material": [
          "현수막천"
        ],
        "cutting": [
          "열재단(10mm 여백)"
        ],
        "environment": [
          "실내용",
          "실외용"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 30000
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 1,
            "unitPrice": 50000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 50000,
          "planningEstimate": 30000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "명함 · 봉투",
    "product_subtype": "명함",
    "status": "draft",
    "sort_order": 8,
    "configuration": {
      "optionValues": {
        "size": [
          "90x50mm"
        ],
        "baseQuantity": [
          "일반지 500",
          "고급지 200"
        ],
        "material": [
          "일반지(스노우, 무광코팅)",
          "고급지(랑데뷰)"
        ],
        "thickness": [
          "보통",
          "두꺼운"
        ],
        "people": [
          "1",
          "2",
          "3"
        ]
      },
      "priceRowsBySelection": {},
      "serviceEstimatesBySelection": {
        "0:0": {
          "designPrintEstimate": 50000,
          "planningEstimate": 20000
        },
        "0:1": {
          "designPrintEstimate": 60000,
          "planningEstimate": 20000
        },
        "1:0": {
          "designPrintEstimate": 50000,
          "planningEstimate": 20000
        },
        "1:1": {
          "designPrintEstimate": 60000,
          "planningEstimate": 20000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "명함 · 봉투",
    "product_subtype": "봉투",
    "status": "draft",
    "sort_order": 9,
    "configuration": {
      "optionValues": {
        "envelopeType": [
          "소봉투 일반형(220x105mm)",
          "소봉투 자켓형(220x105mm)",
          "대봉투(330x245mm)"
        ],
        "material": [
          "일반 봉투재질(백모조지)"
        ],
        "thickness": [
          "보통",
          "두꺼운"
        ]
      },
      "priceRowsBySelection": {
        "0:0:0": [
          {
            "quantity": 500,
            "unitPrice": 120
          },
          {
            "quantity": 1000,
            "unitPrice": 90
          }
        ],
        "0:0:1": [
          {
            "quantity": 500,
            "unitPrice": 880
          },
          {
            "quantity": 1000,
            "unitPrice": 530
          }
        ],
        "1:0:0": [
          {
            "quantity": 500,
            "unitPrice": 120
          },
          {
            "quantity": 1000,
            "unitPrice": 90
          }
        ],
        "1:0:1": [
          {
            "quantity": 500,
            "unitPrice": 880
          },
          {
            "quantity": 1000,
            "unitPrice": 530
          }
        ],
        "2:0:0": [
          {
            "quantity": 500,
            "unitPrice": 380
          },
          {
            "quantity": 1000,
            "unitPrice": 230
          }
        ],
        "2:0:1": [
          {
            "quantity": 500,
            "unitPrice": 1060
          },
          {
            "quantity": 1000,
            "unitPrice": 690
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 30000,
          "planningEstimate": 20000
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  },
  {
    "product_type": "로고",
    "product_subtype": "",
    "status": "draft",
    "sort_order": 10,
    "configuration": {
      "optionValues": {
        "logoType": [
          "워드마크 타입",
          "심볼타입",
          "워드마크+심볼 타입"
        ],
        "proposalCount": [
          "1",
          "2",
          "3"
        ]
      },
      "priceRowsBySelection": {},
      "serviceEstimatesBySelection": {
        "0": {
          "designPrintEstimate": 50000,
          "planningEstimate": null
        },
        "2": {
          "designPrintEstimate": 80000,
          "planningEstimate": null
        }
      },
      "priceModel": "service-plus-print-unit-v1"
    }
  }
]
$variants$::jsonb
  ) as variant(
    product_type text,
    product_subtype text,
    status text,
    sort_order bigint,
    configuration jsonb
  )
),
grouped_seed as (
  select
    variant.product_type,
    (array_agg(variant.status order by variant.sort_order))[1] as status,
    min(variant.sort_order) as first_sort_order,
    jsonb_build_object(
      'variants',
      jsonb_object_agg(
        coalesce(nullif(variant.product_subtype, ''), variant.product_type),
        variant.configuration
        order by variant.sort_order
      )
    ) as configuration
  from variant_seed as variant
  group by variant.product_type
),
ordered_seed as (
  select
    grouped.product_type,
    grouped.status,
    row_number() over (
      order by grouped.first_sort_order, grouped.product_type
    )::bigint as sort_order,
    grouped.configuration
  from grouped_seed as grouped
)
insert into public.products (
  product_type,
  status,
  sort_order,
  configuration
)
select
  product_type,
  status,
  sort_order,
  configuration
from ordered_seed
on conflict (product_type) do nothing;

select setval(
  pg_get_serial_sequence('public.products', 'sort_order'),
  coalesce((select max(sort_order) from public.products), 0) + 1,
  false
);

commit;

-- Expected result after the initial run: 6 / 98 / 17.
select
  count(*) as product_count,
  sum(variant_counts.price_count) as price_selection_count,
  sum(variant_counts.service_count) as service_selection_count
from public.products as product
cross join lateral (
  select
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'priceRowsBySelection')
    )) as price_count,
    sum((
      select count(*)
      from jsonb_object_keys(variant.value -> 'serviceEstimatesBySelection')
    )) as service_count
  from jsonb_each(product.configuration -> 'variants') as variant
) as variant_counts
where product.product_type = any(array[
  '브로슈어 · 카탈로그',
  '리플렛 · 팜플렛',
  '포스터 · 전단지',
  '배너 · 족자 · 현수막',
  '명함 · 봉투',
  '로고'
]::text[]);
