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
            "unitPrice": 850000
          },
          {
            "quantity": 200,
            "unitPrice": 1010000
          },
          {
            "quantity": 300,
            "unitPrice": 1130000
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 850000
          },
          {
            "quantity": 200,
            "unitPrice": 1010000
          },
          {
            "quantity": 300,
            "unitPrice": 1130000
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1240000
          },
          {
            "quantity": 200,
            "unitPrice": 1440000
          },
          {
            "quantity": 300,
            "unitPrice": 1620000
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1240000
          },
          {
            "quantity": 200,
            "unitPrice": 1440000
          },
          {
            "quantity": 300,
            "unitPrice": 1620000
          }
        ],
        "2:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1610000
          },
          {
            "quantity": 200,
            "unitPrice": 1870000
          },
          {
            "quantity": 300,
            "unitPrice": 1910000
          }
        ],
        "2:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1610000
          },
          {
            "quantity": 200,
            "unitPrice": 1870000
          },
          {
            "quantity": 300,
            "unitPrice": 1910000
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 860000
          },
          {
            "quantity": 200,
            "unitPrice": 1020000
          },
          {
            "quantity": 300,
            "unitPrice": 1140000
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 860000
          },
          {
            "quantity": 200,
            "unitPrice": 1020000
          },
          {
            "quantity": 300,
            "unitPrice": 1140000
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1250000
          },
          {
            "quantity": 200,
            "unitPrice": 1450000
          },
          {
            "quantity": 300,
            "unitPrice": 1630000
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1250000
          },
          {
            "quantity": 200,
            "unitPrice": 1450000
          },
          {
            "quantity": 300,
            "unitPrice": 1630000
          }
        ],
        "2:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1620000
          },
          {
            "quantity": 200,
            "unitPrice": 1900000
          },
          {
            "quantity": 300,
            "unitPrice": 1940000
          }
        ],
        "2:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1620000
          },
          {
            "quantity": 200,
            "unitPrice": 1900000
          },
          {
            "quantity": 300,
            "unitPrice": 1940000
          }
        ],
        "0:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 860000
          },
          {
            "quantity": 200,
            "unitPrice": 1030000
          },
          {
            "quantity": 300,
            "unitPrice": 1160000
          }
        ],
        "0:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 860000
          },
          {
            "quantity": 200,
            "unitPrice": 1030000
          },
          {
            "quantity": 300,
            "unitPrice": 1160000
          }
        ],
        "1:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1250000
          },
          {
            "quantity": 200,
            "unitPrice": 1470000
          },
          {
            "quantity": 300,
            "unitPrice": 1660000
          }
        ],
        "1:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1250000
          },
          {
            "quantity": 200,
            "unitPrice": 1470000
          },
          {
            "quantity": 300,
            "unitPrice": 1660000
          }
        ],
        "2:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1620000
          },
          {
            "quantity": 200,
            "unitPrice": 1900000
          },
          {
            "quantity": 300,
            "unitPrice": 2000000
          }
        ],
        "2:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1620000
          },
          {
            "quantity": 200,
            "unitPrice": 1900000
          },
          {
            "quantity": 300,
            "unitPrice": 2000000
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 880000
          },
          {
            "quantity": 200,
            "unitPrice": 1060000
          },
          {
            "quantity": 300,
            "unitPrice": 1210000
          }
        ],
        "0:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 880000
          },
          {
            "quantity": 200,
            "unitPrice": 1060000
          },
          {
            "quantity": 300,
            "unitPrice": 1210000
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1280000
          },
          {
            "quantity": 200,
            "unitPrice": 1510000
          },
          {
            "quantity": 300,
            "unitPrice": 1720000
          }
        ],
        "1:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1280000
          },
          {
            "quantity": 200,
            "unitPrice": 1510000
          },
          {
            "quantity": 300,
            "unitPrice": 1720000
          }
        ],
        "2:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 1650000
          },
          {
            "quantity": 200,
            "unitPrice": 1960000
          },
          {
            "quantity": 300,
            "unitPrice": 2090000
          }
        ],
        "2:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 1650000
          },
          {
            "quantity": 200,
            "unitPrice": 1960000
          },
          {
            "quantity": 300,
            "unitPrice": 2090000
          }
        ],
        "0:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 890000
          },
          {
            "quantity": 200,
            "unitPrice": 1080000
          },
          {
            "quantity": 300,
            "unitPrice": 1230000
          }
        ],
        "0:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 890000
          },
          {
            "quantity": 200,
            "unitPrice": 1080000
          },
          {
            "quantity": 300,
            "unitPrice": 1230000
          }
        ],
        "1:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1290000
          },
          {
            "quantity": 200,
            "unitPrice": 1540000
          },
          {
            "quantity": 300,
            "unitPrice": 1760000
          }
        ],
        "1:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1290000
          },
          {
            "quantity": 200,
            "unitPrice": 1540000
          },
          {
            "quantity": 300,
            "unitPrice": 1760000
          }
        ],
        "2:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 1670000
          },
          {
            "quantity": 200,
            "unitPrice": 1990000
          },
          {
            "quantity": 300,
            "unitPrice": 2150000
          }
        ],
        "2:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 1670000
          },
          {
            "quantity": 200,
            "unitPrice": 1990000
          },
          {
            "quantity": 300,
            "unitPrice": 2150000
          }
        ],
        "0:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 900000
          },
          {
            "quantity": 200,
            "unitPrice": 1100000
          },
          {
            "quantity": 300,
            "unitPrice": 1260000
          }
        ],
        "0:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 900000
          },
          {
            "quantity": 200,
            "unitPrice": 1100000
          },
          {
            "quantity": 300,
            "unitPrice": 1260000
          }
        ],
        "1:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1300000
          },
          {
            "quantity": 200,
            "unitPrice": 1560000
          },
          {
            "quantity": 300,
            "unitPrice": 1790000
          }
        ],
        "1:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1300000
          },
          {
            "quantity": 200,
            "unitPrice": 1560000
          },
          {
            "quantity": 300,
            "unitPrice": 1790000
          }
        ],
        "2:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 1680000
          },
          {
            "quantity": 200,
            "unitPrice": 2010000
          },
          {
            "quantity": 300,
            "unitPrice": 2240000
          }
        ],
        "2:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 1680000
          },
          {
            "quantity": 200,
            "unitPrice": 2010000
          },
          {
            "quantity": 300,
            "unitPrice": 2240000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      }
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
          "고급지(량데뷰)"
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
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 970000
          },
          {
            "quantity": 750,
            "unitPrice": 1020000
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 970000
          },
          {
            "quantity": 750,
            "unitPrice": 1020000
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 970000
          },
          {
            "quantity": 750,
            "unitPrice": 1040000
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 970000
          },
          {
            "quantity": 750,
            "unitPrice": 1040000
          }
        ],
        "0:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 790000
          },
          {
            "quantity": 200,
            "unitPrice": 980000
          },
          {
            "quantity": 750,
            "unitPrice": 1080000
          }
        ],
        "0:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 790000
          },
          {
            "quantity": 200,
            "unitPrice": 980000
          },
          {
            "quantity": 750,
            "unitPrice": 1080000
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 1000000
          },
          {
            "quantity": 750,
            "unitPrice": 1230000
          }
        ],
        "0:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 780000
          },
          {
            "quantity": 200,
            "unitPrice": 1000000
          },
          {
            "quantity": 750,
            "unitPrice": 1230000
          }
        ],
        "0:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 800000
          },
          {
            "quantity": 200,
            "unitPrice": 1020000
          },
          {
            "quantity": 750,
            "unitPrice": 1250000
          }
        ],
        "0:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 800000
          },
          {
            "quantity": 200,
            "unitPrice": 1020000
          },
          {
            "quantity": 750,
            "unitPrice": 1250000
          }
        ],
        "0:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 840000
          },
          {
            "quantity": 200,
            "unitPrice": 1060000
          },
          {
            "quantity": 750,
            "unitPrice": 1290000
          }
        ],
        "0:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 840000
          },
          {
            "quantity": 200,
            "unitPrice": 1060000
          },
          {
            "quantity": 750,
            "unitPrice": 1290000
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 790000
          },
          {
            "quantity": 500,
            "unitPrice": 910000
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 790000
          },
          {
            "quantity": 500,
            "unitPrice": 910000
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 790000
          },
          {
            "quantity": 500,
            "unitPrice": 930000
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 790000
          },
          {
            "quantity": 500,
            "unitPrice": 930000
          }
        ],
        "1:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 800000
          },
          {
            "quantity": 500,
            "unitPrice": 950000
          }
        ],
        "1:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 640000
          },
          {
            "quantity": 300,
            "unitPrice": 800000
          },
          {
            "quantity": 500,
            "unitPrice": 950000
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 750000
          },
          {
            "quantity": 500,
            "unitPrice": 1010000
          }
        ],
        "1:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 750000
          },
          {
            "quantity": 500,
            "unitPrice": 1010000
          }
        ],
        "1:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 850000
          },
          {
            "quantity": 500,
            "unitPrice": 1030000
          }
        ],
        "1:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 850000
          },
          {
            "quantity": 500,
            "unitPrice": 1030000
          }
        ],
        "1:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 840000
          },
          {
            "quantity": 500,
            "unitPrice": 1010000
          }
        ],
        "1:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 660000
          },
          {
            "quantity": 300,
            "unitPrice": 840000
          },
          {
            "quantity": 500,
            "unitPrice": 1010000
          }
        ],
        "2:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 520000
          },
          {
            "quantity": 1000,
            "unitPrice": 670000
          }
        ],
        "2:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 520000
          },
          {
            "quantity": 1000,
            "unitPrice": 670000
          }
        ],
        "2:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 520000
          },
          {
            "quantity": 1000,
            "unitPrice": 690000
          }
        ],
        "2:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 520000
          },
          {
            "quantity": 1000,
            "unitPrice": 690000
          }
        ],
        "2:0:2:0": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 530000
          },
          {
            "quantity": 1000,
            "unitPrice": 710000
          }
        ],
        "2:0:2:1": [
          {
            "quantity": 100,
            "unitPrice": 370000
          },
          {
            "quantity": 500,
            "unitPrice": 530000
          },
          {
            "quantity": 1000,
            "unitPrice": 710000
          }
        ],
        "2:1:0:0": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          },
          {
            "quantity": 1000,
            "unitPrice": 780000
          }
        ],
        "2:1:0:1": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          },
          {
            "quantity": 1000,
            "unitPrice": 780000
          }
        ],
        "2:1:1:0": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 570000
          },
          {
            "quantity": 1000,
            "unitPrice": 790000
          }
        ],
        "2:1:1:1": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 570000
          },
          {
            "quantity": 1000,
            "unitPrice": 790000
          }
        ],
        "2:1:2:0": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          },
          {
            "quantity": 1000,
            "unitPrice": 780000
          }
        ],
        "2:1:2:1": [
          {
            "quantity": 100,
            "unitPrice": 380000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          },
          {
            "quantity": 1000,
            "unitPrice": 780000
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
      }
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
            "unitPrice": 520000
          },
          {
            "quantity": 300,
            "unitPrice": 590000
          },
          {
            "quantity": 500,
            "unitPrice": 650000
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 520000
          },
          {
            "quantity": 300,
            "unitPrice": 590000
          },
          {
            "quantity": 500,
            "unitPrice": 650000
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 550000
          },
          {
            "quantity": 300,
            "unitPrice": 660000
          },
          {
            "quantity": 500,
            "unitPrice": 740000
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 550000
          },
          {
            "quantity": 300,
            "unitPrice": 660000
          },
          {
            "quantity": 500,
            "unitPrice": 740000
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 100,
            "unitPrice": 440000
          },
          {
            "quantity": 300,
            "unitPrice": 540000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          }
        ],
        "1:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 440000
          },
          {
            "quantity": 300,
            "unitPrice": 540000
          },
          {
            "quantity": 500,
            "unitPrice": 560000
          }
        ],
        "1:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 450000
          },
          {
            "quantity": 300,
            "unitPrice": 570000
          },
          {
            "quantity": 500,
            "unitPrice": 610000
          }
        ],
        "1:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 450000
          },
          {
            "quantity": 300,
            "unitPrice": 570000
          },
          {
            "quantity": 500,
            "unitPrice": 610000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 250000,
          "planningEstimate": 200000
        }
      }
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
            "unitPrice": 130000
          },
          {
            "quantity": 300,
            "unitPrice": 160000
          },
          {
            "quantity": 4000,
            "unitPrice": 190000
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 100,
            "unitPrice": 190000
          },
          {
            "quantity": 300,
            "unitPrice": 250000
          },
          {
            "quantity": 4000,
            "unitPrice": 260000
          }
        ],
        "0:0:1:0": [
          {
            "quantity": 100,
            "unitPrice": 130000
          },
          {
            "quantity": 300,
            "unitPrice": 170000
          },
          {
            "quantity": 4000,
            "unitPrice": 290000
          }
        ],
        "0:0:1:1": [
          {
            "quantity": 100,
            "unitPrice": 200000
          },
          {
            "quantity": 300,
            "unitPrice": 260000
          },
          {
            "quantity": 4000,
            "unitPrice": 360000
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
      }
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
            "unitPrice": 110000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ],
        "0:1:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 130000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      }
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
            "unitPrice": 130000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ],
        "0:1:0:0": [
          {
            "quantity": 1,
            "unitPrice": 140000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ],
        "1:0:0:0": [
          {
            "quantity": 1,
            "unitPrice": 130000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ],
        "1:1:0:0": [
          {
            "quantity": 1,
            "unitPrice": 160000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 80000,
          "planningEstimate": 50000
        }
      }
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
            "unitPrice": 80000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ],
        "0:0:0:1": [
          {
            "quantity": 1,
            "unitPrice": 100000
          },
          {
            "quantity": 2,
            "unitPrice": null
          },
          {
            "quantity": 3,
            "unitPrice": null
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 50000,
          "planningEstimate": 30000
        }
      }
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
      }
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
            "unitPrice": 90000
          },
          {
            "quantity": 1000,
            "unitPrice": 120000
          }
        ],
        "0:0:1": [
          {
            "quantity": 500,
            "unitPrice": 470000
          },
          {
            "quantity": 1000,
            "unitPrice": 560000
          }
        ],
        "1:0:0": [
          {
            "quantity": 500,
            "unitPrice": 90000
          },
          {
            "quantity": 1000,
            "unitPrice": 120000
          }
        ],
        "1:0:1": [
          {
            "quantity": 500,
            "unitPrice": 470000
          },
          {
            "quantity": 1000,
            "unitPrice": 560000
          }
        ],
        "2:0:0": [
          {
            "quantity": 500,
            "unitPrice": 220000
          },
          {
            "quantity": 1000,
            "unitPrice": 260000
          }
        ],
        "2:0:1": [
          {
            "quantity": 500,
            "unitPrice": 560000
          },
          {
            "quantity": 1000,
            "unitPrice": 720000
          }
        ]
      },
      "serviceEstimatesBySelection": {
        "": {
          "designPrintEstimate": 30000,
          "planningEstimate": 20000
        }
      }
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
      }
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
