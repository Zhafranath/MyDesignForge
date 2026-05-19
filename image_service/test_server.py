import os
import unittest
from unittest.mock import patch

from image_service import server


class DeviceSelectionTests(unittest.TestCase):
    def test_requested_xpu_falls_back_to_cpu_when_unavailable(self):
        with patch.dict(os.environ, {"SDXL_DEVICE": "xpu"}, clear=False):
            with patch.object(server.torch.xpu, "is_available", return_value=False):
                with patch.object(server.torch.cuda, "is_available", return_value=False):
                    self.assertEqual(server.select_device(), "cpu")

    def test_requested_fp16_falls_back_to_fp32_on_cpu(self):
        with patch.dict(os.environ, {"SDXL_DTYPE": "fp16"}, clear=False):
            self.assertEqual(server.select_dtype("cpu"), server.torch.float32)


class GenerationConfigTests(unittest.TestCase):
    def test_xpu_dimensions_are_capped_for_local_vram(self):
        with patch.dict(os.environ, {"SDXL_WIDTH": "768", "SDXL_HEIGHT": "768"}, clear=False):
            self.assertEqual(server.select_dimensions("xpu"), (512, 512))

    def test_sticker_prompt_keeps_sticker_instructions_at_front_and_shortens_user_prompt(self):
        long_prompt = " ".join(f"detail{i}" for i in range(90))

        prompt = server.build_sticker_prompt(long_prompt)

        self.assertTrue(prompt.startswith("transparent background, sticker-ready"))
        self.assertLessEqual(len(prompt.split()), 72)
        self.assertIn("detail0", prompt)
        self.assertNotIn("detail89", prompt)

    def test_sticker_prompt_compacts_structured_website_prompt(self):
        structured_prompt = """
Sticker design prompt:
Character form: cute animal mascot.
Main character: sleepy orange tabby cat barista.
Text in design: no readable text.
Theme: simple cute kawaii.
Expression: happy sleepy smile.
Pose/action: holding a tiny coffee cup with droopy eyes.
Visual style: clean vector sticker, thick outline, flat colors.
Composition: large centered full body character.
Sticker details: transparent background, thick white border, die-cut outline.
Avoid: watermark, logo, messy background.
"""

        prompt = server.build_sticker_prompt(structured_prompt)

        self.assertLessEqual(len(prompt.split()), 72)
        self.assertIn("sleepy orange tabby cat barista", prompt)
        self.assertIn("no readable text", prompt)
        self.assertIn("simple cute kawaii", prompt)
        self.assertNotIn("Sticker design prompt:", prompt)

    def test_sticker_prompt_prioritizes_complete_uncropped_subject(self):
        prompt = server.build_sticker_prompt("cute blue cat happy sticker")

        self.assertIn("full body complete character visible", prompt)
        self.assertIn("safe margins", prompt)
        self.assertIn("no close-up", prompt)
        self.assertIn("no cropped head", prompt)
        self.assertIn("no cut off body", prompt)

    def test_sticker_prompt_prioritizes_custom_text_when_present(self):
        structured_prompt = """
Sticker design prompt:
Character form: cute animal mascot.
Main character: blue cat.
Text in design: text reading "WOW!" as large readable hand-lettered text on a clean speech bubble.
Theme: simple cute kawaii.
Expression: happy.
Pose/action: jumping.
Visual style: clean vector sticker.
Composition: full body complete character visible.
"""

        prompt = server.build_sticker_prompt(structured_prompt)

        self.assertIn('large readable exact text "WOW!"', prompt)
        self.assertIn('do not omit text', prompt)
        self.assertIn('text reading "WOW!"', prompt)


if __name__ == "__main__":
    unittest.main()
