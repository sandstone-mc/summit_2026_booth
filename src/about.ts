import { Tag, Dialog } from "sandstone";

Tag("dialog", "smithed:data_packs", [
    {
      "id": "arcane_arts:about",
      "required": false
    }
])

Tag("dialog", "minecraft:pause_screen_additions", [
    {
      "id": "smithed:data_packs",
      "required": false
    }
])

Dialog("smithed:data_packs", {
  "type": "minecraft:dialog_list",
  "external_title": {
    "translate": "menu.smithed.data_packs",
    "fallback": "%s...",
    "with": [
      {
        "translate": "selectWorld.dataPacks"
      }
    ]
  },
  "title": {
    "translate": "menu.smithed.data_packs.title",
    "fallback": "%s",
    "with": [
      {
        "translate": "selectWorld.dataPacks"
      }
    ]
  },
  "dialogs": "#smithed:data_packs",
  "exit_action": {
    "label": {
      "translate": "gui.back"
    },
    "width": 200
  }
})

Dialog("about", {
  "type": "minecraft:multi_action",
  "title": "Arcane Arts",
  "body": [
    {
      "type": "minecraft:plain_message",
      "contents": "A simple spellcasting experience!",
      "width": 300
    },
    {
      "type": "minecraft:plain_message",
      "contents": {
        "text": "v0.1.0\nBy LilSpartan904",
        "color": "gray"
      },
      "width": 300
    }
  ],
  "actions": [
    {
      "label": "Made With Sandstone",
      "action": {
        "type": "open_url",
        "url": "https://sandstone.dev/"
      }
    },
    // {
    //   "label": "Modrinth",
    //   "action": {
    //     "type": "open_url",
    //     "url": "https://github.com/example/test/issues"
    //   }
    // },
    // {
    //   "label": "Config..",
    //   "action": {
    //     "type": "minecraft:run_command",
    //     "command": "function example:config"
    //   }
    // }
  ],
  "exit_action": {
    "action": {
      "type": "show_dialog",
      "dialog": "smithed:data_packs"
    },
    "label": {
      "translate": "gui.back"
    },
    "width": 200
  }
})