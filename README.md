{
    "id": "8d1bfee5-c6d0-4876-960c-b69a9a43980e",
    "type": "SENTENCE_TRANSFORMATION",
    "topic": [
        "present_simple",
        "verb"
    ],
    "instruction": "Fill in the blank with correct form of verb",
    "image_urls": [
        "https://example.com/image1.jpg"
    ],
    "max_time": 60,
    "version": 2,
    "sentence_transformation": {
        "id": "4ac7866f-a15b-48b5-9aa7-c88b3cef49e4",
        "original_sentence": "He goes to school every day",
        "beginning_word": "Every day",
        "example_correct_sentence": "Every day he goes to school",
        "explain": "We can move time expressions to the beginning of the sentence"
    }
}

{
                "id": "b3204099-ef97-449e-9d2f-d2cb31bcfb77",
                "type": "ERROR_IDENTIFICATION",
                "topic": [
                    "present_simple",
                    "verb"
                ],
                "instruction": "Fill in the blank with correct form of verb",
                "image_urls": [
                    "https://example.com/image1.jpg"
                ],
                "max_time": 60,
                "version": 2,
                "error_identification": {
                    "id": "1f58c61d-9f6b-4bc0-9be9-a07c696ab430",
                    "error_sentence": "He go to school every day",
                    "error_word": "go",
                    "correct_word": "goes",
                    "explain": "Third person singular needs -s in present simple"
                }
            }
        

{
                "id": "bb749abf-03d5-4336-bbab-b33d97a8a691",
                "type": "FILL_IN_THE_BLANK",
                "topic": [
                    "present_simple",
                    "verb"
                ],
                "instruction": "Fill in the blank with correct form of verb",
                "image_urls": [
                    "https://example.com/image1.jpg"
                ],
                "max_time": 60,
                "version": 3,
                "fill_in_the_blank_question": {
                    "id": "1c73fa12-ecbc-4662-a6e6-211e59552022",
                    "question": "I ___ to school every day"
                },
                "fill_in_the_blank_answers": [
                    {
                        "id": "7b94eb87-1633-4635-9750-d3d3292ea579",
                        "answer": "go",
                        "explain": "Use present simple for daily routines"
                    }
                ]
            },



            {
                "id": "46da4e33-6899-4ed0-9056-340cdf6c90cf",
                "type": "CHOICE_ONE",
                "topic": [
                    "present_simple",
                    "verb"
                ],
                "instruction": "Fill in the blank with correct form of verb",
                "image_urls": [
                    "https://example.com/image1.jpg"
                ],
                "max_time": 60,
                "version": 3,
                "choice_one_question": {
                    "id": "37baf07d-5b10-43e9-a5c0-9257267a6e85",
                    "question": "Choose the correct form of verb",
                    "explain": "Use present simple for daily routines"
                },
                "choice_one_options": [
                    {
                        "id": "5fbecefd-53e4-464c-818e-aabc44f91e47",
                        "options": "goes",
                        "is_correct": true
                    }
                ]
            }