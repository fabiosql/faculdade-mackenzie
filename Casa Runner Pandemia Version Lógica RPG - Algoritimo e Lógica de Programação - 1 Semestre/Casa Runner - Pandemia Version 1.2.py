#RPG

print("Olá, bem vindo ao jogo Casa Runner - Pandemia version")
print("========= VOCÊ ESTÁ EM: ENTRADA =========")

local1 = input("Escolha um local que voce deseja ir: sala ou cozinha?: ")

if(local1 == "sala"):
  print("========= VOCÊ ESTÁ EM: SALA =========")
  local2 = input("Você cansou de assistir TV, onde você gostaria de ir agora? quarto ou copa? ")
  
  if(local2 == "quarto"):

    print("========= VOCÊ ESTÁ EM: QUARTO =========")
    
    local3 = input("Você já dormiu demais,  gostaria de ir no quinta? sim ou nao? ")

    if(local3 == "sim"):
      print("========= VOCÊ ESTÁ EM: QUINTAL =========")
      print("========= Esse JOGO não permite que voce volte, agora voce esta preso no quintal - ENDGAME =========")

    if(local3 == "nao"):
      print("Voce não saiu do quarto")
      
  if(local2 == "copa"):
    print("========= VOCÊ ESTÁ EM: COPA =========")
       
    local4 = input("Voce ja cansou de ficar na copa gostaria de ir no quinta? sim ou nao? ")
       
    if(local4 == "sim"):
      print("========= VOCÊ ESTÁ EM: QUINTAL =========")
      print("========= Esse JOGO não permite que voce volte, agora voce esta preso no quintal - ENDGAME =========")
    if(local4 == "nao"):
      print("Voce não saiu da Copa")
    
if(local1 == "cozinha"):

  print("========= VOCÊ ESTÁ EM: COZINHA =========")
  local2 = input("Você já comeu demais, onde você gostaria de ir agora? copa ou quintal? ")
  
  if(local2 == "copa"):
    print("========= VOCÊ ESTÁ EM: COPA =========")
       
    local4 = input("Voce ja cansou de ficar na copa gostaria de ir no quinta? sim ou nao? ")
       
    if(local4 == "sim"):
      print("========= VOCÊ ESTÁ EM: QUINTAL =========")
      print("========= Esse software não permite que voce volte, agora voce esta preso no quintal - ENDGAME =========")
        
      if(local4 == "nao"):
        print("Voce não saiu da Copa")
  if(local2 == "quintal"):
    print("========= VOCÊ ESTÁ EM: QUINTAL =========")
    print("========= Esse software não permite que voce volte, agora voce esta preso no quintal - ENDGAME =========")
    
