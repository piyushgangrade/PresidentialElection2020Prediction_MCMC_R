# setwd("~/Downloads/data_files")
# In this project, the goal is to make a Monte Carlo Markov Chain (MCMC) model to predict the 2020 presidential election.
# To build this model, first we focus on writing a dynamic scraping program that pulls in all of the current state polling data from RealClearPolitics. Then we use the state polling data to simulate 10,000 elections. The winner of each trial is determined by which candidate has the most electoral votes. We then use the results of the 10,000 trials to calculate the probability that each candidate will win the election. Finally, we use the probabilities to make a prediction for the 2020 presidential election.
# Use the data to suggest and create visualizations that will help you understand the data and the model.
library(dplyr)
library(tidyr)
library(stringr)
library(rvest)
library(SuppDists)
library(ggplot2)

#install.packages(c('dplyr','tidyr','stringr','rvest','SuppDists'))

votes_map_html <- read_html("data_files/RealClearPolitics - 2020 Election Maps - 2020 Electoral College Map.html")

votes_map_html_text <- html_text(votes_map_html)

Toss_ups <- votes_map_html_text %>% str_extract_all('(?<=<span class="full">)(.*?)(?=</span>)') %>% unlist()
Toss_ups <- Toss_ups[Toss_ups != '']

Solid_States <- votes_map_html_text %>% str_extract_all('(?<=<h3 class="red-bar-section">Solid States</h3>)(.*?)(?=</div>)') %>% unlist()

Solid_States <- Solid_States %>% str_extract_all('(?<=<span>)(.*?)(?=</span>)') %>% unlist()

Electoral_Votes <- c(Toss_ups, Solid_States)

Electoral_Votes <- Electoral_Votes %>% str_replace_all('\\)', '')

Electoral_Votes <- str_split_fixed(Electoral_Votes, " \\(", 2) %>% 
  as.data.frame()

names(Electoral_Votes) <- c("State", "Votes")

Electoral_Votes$Votes <- as.numeric(
  as.character(Electoral_Votes$Votes)
) 

rm(votes_map_html, Toss_ups, Solid_States)

Summary_2020 <- read_html("data_files/RealClearPolitics - 2020 Election Maps - 2020 Electoral College Map.html")

Summary_2020_html_text <- html_text(Summary_2020)

Summary_2020 <- Summary_2020_html_text %>% 
  str_extract_all('(?<=href=")(.*?)(?=">)') %>% 
  unlist() %>% 
  unique()

Summary_2020 <- Summary_2020[str_detect(Summary_2020, "trump_vs_biden")]

Summary_2020 <- Summary_2020 %>% 
  str_replace_all("/epolls/2020/president/", "") %>% 
  str_replace_all(".html", "") %>% 
  str_replace_all("-", "/") %>% 
  as.data.frame()

names(Summary_2020) <- "HTML_File"

Summary_2020 <- str_split_fixed(Summary_2020$HTML_File, "/", 3) %>% 
  as.data.frame()

names(Summary_2020) <- c("Abbrev", "state_id", "id")

Summary_2020 <- Summary_2020 %>% mutate(
  State = state_id %>% 
    str_replace_all("_trump", "") %>% 
    str_replace_all("_vs", "") %>% 
    str_replace_all("_biden", "") %>% 
    str_replace_all("_jorgensen", "") %>% 
    str_replace_all("_hawkins", "") %>%
    str_replace_all("_", " ") %>% 
    str_to_title() %>%
    str_replace_all("Cd", "CD"),
  HTML_File = paste0("data_files/State_wise/", state_id, "-", id, ".html")
) %>% arrange(State)

State_Polls_2020_PA <- read_html(
  "data_files/State_wise/pennsylvania_trump_vs_biden-6861.html") %>%
  html_nodes("table") %>%
  html_table()

State_Polls_2020_PA[[1]]

rcp_average <- State_Polls_2020_PA[[1]][2,1]

State_Polls_2020 <- as.data.frame(matrix(NA, nrow = 0, ncol = 7))
names(State_Polls_2020) <- c("Poll", "Date", "Sample", 
                             "Biden (D)", "Trump (R)", 
                             "State", "Rank")

for(i in 1:nrow(Summary_2020)){
  link <- Summary_2020$HTML_File[i]
  state <- Summary_2020$State[i]
  # print(state)
  
  state_polls <- read_html(link) %>% 
    html_nodes("table") %>% 
    html_table()
  
  max <- length(state_polls)
  # print(max)
  
  if(max > 0){
    if(state == "New Hampshire" | state == "New Mexico" | state == "Washington"){
      state_polls <- state_polls[[1]] %>% 
        select(Poll, Date, Sample, `Biden (D)`, `Trump (R) *`) %>% 
        rename("Trump (R)" = `Trump (R) *`)
    } else {
      state_polls <- state_polls[[1]] %>% 
        select(Poll, Date, Sample, `Biden (D)`, `Trump (R)`)
    }
    state_polls$State <- state
    state_polls <- state_polls %>% filter(Poll != rcp_average)
    state_polls$Rank <- 1:nrow(state_polls)
    State_Polls_2020 <- rbind(State_Polls_2020, state_polls)
  }
}

State_Polls_2020 <- State_Polls_2020 %>% 
  rename("Biden" = `Biden (D)`, "Trump" = `Trump (R)`) %>% 
  mutate(Spread = Trump - Biden)

RCP_Averages_2020 <- State_Polls_2020 %>% 
  filter(Poll == rcp_average)

State_Polls_2020 <- State_Polls_2020 %>% 
  filter(Poll != rcp_average)

State_Summary_2020 <- State_Polls_2020 %>% 
  filter(Rank <= 5) %>% 
  group_by(State) %>% 
  summarize(
    Spread_2020 = mean(Spread)
  )

SD_2020 <- State_Polls_2020 %>% 
  group_by(State) %>% 
  summarize(
    Stdev_2020 = sd(Spread)
  )

State_Summary_2020 <- State_Summary_2020 %>% 
  left_join(SD_2020)

rm(SD_2020, state_polls, State_Polls_2020_PA, Summary_2020)

ggplot(State_Summary_2020, aes(x = reorder(State, Spread_2020), y = Spread_2020)) +
  geom_bar(stat = "identity", fill = "blue") +
  coord_flip() +
  geom_errorbar(aes(ymin = Spread_2020 - Stdev_2020, ymax = Spread_2020 + Stdev_2020), width = 0.2) +
  labs(title = "2020 State Polls", x = "State", y = "Spread") +
  theme(plot.title = element_text(hjust = 0.5))


National_2020 <- read_html(
  "data_files/State_wise/general_election_trump_vs_biden-6247.html") %>%
  html_nodes("table") %>%
  html_table()

National_2020 <- National_2020[[4]]

National_2020 <- National_2020 %>% 
  rename("Biden" = `Biden (D)`, "Trump" = `Trump (R)`) %>% 
  mutate(Spread = Trump - Biden)

National_Spread_2020_Current <- as.numeric(National_2020[1, 7])
National_Sd_2020 <- sd(National_2020$Spread[-1])

rm(National_2020)

Summary_2016 <- read_html(
  "data_files/2016_elections_electoral_college_map.html"
)

Summary_2016_html_text <- html_text(Summary_2016)

Summary_2016 <- Summary_2016_html_text %>% 
  str_extract_all('(?<=href=")(.*?)(?=">)') %>% 
  unlist() %>% 
  unique()

Summary_2016 <- Summary_2016[str_detect(Summary_2016, "trump_vs_clinton")]
Summary_2016 <- Summary_2016 %>% 
  str_replace_all("/epolls/2016/president/", "") %>% 
  str_replace_all(".html", "") %>% 
  str_replace_all("-", "/") %>% 
  as.data.frame()

names(Summary_2016) <- "Link"

Summary_2016 <- str_split_fixed(Summary_2016$Link, "/", 3) %>% 
  as.data.frame()

names(Summary_2016) <- c("Abbrev", "state_id", "id")

Summary_2016 <- Summary_2016 %>% mutate(
  State = state_id %>% 
    str_replace_all("_trump", "") %>% 
    str_replace_all("_vs", "") %>% 
    str_replace_all("_clinton", "") %>% 
    str_replace_all("_johnson", "") %>% 
    str_replace_all("_stein", "") %>% 
    str_replace_all("_mcmullin", "") %>% 
    str_replace_all("_", " ") %>% 
    str_to_title() %>%
    str_replace_all("Cd", "CD"),
  Link = paste0("data_files/State_wise2016/", state_id, "-", id, ".html")
) %>% arrange(State)

State_Polls_2016 <- as.data.frame(matrix(NA, nrow = 0, ncol = 7))
names(State_Polls_2016) <- c("Poll", "Date", "Sample", 
                             "Clinton (D)", "Trump (R)", 
                             "State", "Rank")

for(i in 1:nrow(Summary_2016)){
  link <- Summary_2016$Link[i]
  state <- Summary_2016$State[i]
  # print(state)
  
  state_polls <- read_html(link) %>% 
    html_nodes("table") %>% 
    html_table()
  
  max <- length(state_polls)
  # print(max)
  
  if(max > 0){
    state_polls <- state_polls[[1]] %>% 
      select(Poll, Date, Sample, `Clinton (D)`, `Trump (R)`)
    
    state_polls$State <- state
    state_polls$Rank <- 1:nrow(state_polls)
    State_Polls_2016 <- rbind(State_Polls_2016, state_polls)
  }
}

State_Polls_2016 <- State_Polls_2016 %>% 
  rename("Clinton" = `Clinton (D)`, "Trump" = `Trump (R)`) %>% 
  mutate(Spread = Trump - Clinton)

RCP_Finals_2016 <- State_Polls_2016 %>% 
  filter(Poll == "Final Results")

State_Polls_2016 <- State_Polls_2016 %>% 
  filter(Poll != "Final Results", Poll != rcp_average)


SD_2016 <- State_Polls_2016 %>% 
  group_by(State) %>% 
  summarize(
    Stdev_2016 = sd(Spread)
  )

State_Summary_2016 <- RCP_Finals_2016 %>% 
  left_join(SD_2016) %>% 
  select(State, Spread_2016 = Spread, Stdev_2016)

ggplot(State_Summary_2016, aes(x = reorder(State, Spread_2016), y = Spread_2016)) +
  geom_bar(stat = "identity", fill = "orange") +
  coord_flip() +
  geom_errorbar(aes(ymin = Spread_2016 - Stdev_2016, ymax = Spread_2016 + Stdev_2016), width = 0.2) +
  labs(title = "2016 State Polls", x = "State", y = "Spread") +
  theme(plot.title = element_text(hjust = 0.5))


rm(SD_2016, state_polls, Summary_2016)

National_2016 <- read_html("data_files/general_election_trump_vs_clinton-5491.html") %>%
  html_nodes("table") %>%
  html_table()

National_2016 <- National_2016[[4]]

National_2016 <- National_2016 %>% 
  rename("Clinton" = `Clinton (D)`, "Trump" = `Trump (R)`) %>% 
  mutate(Spread = Trump - Clinton)

National_Spread_2016_Average <- as.numeric(National_2016[2, 7])
National_Sd_2016 <- sd(National_2016$Spread[-1])


# Sort the data frame by the number of votes
Electoral_Votes_arranged <- Electoral_Votes %>%
  arrange(desc(Votes))


# Create the bar plot
ggplot(Electoral_Votes_arranged, aes(x = reorder(State, Votes), y = Votes)) +
  geom_bar(stat = "identity", fill = "blue") +
  coord_flip() +
  labs(title = "Electoral Votes by State", x = "State", y = "Electoral Votes") +
  theme(plot.title = element_text(hjust = 0.5))

rm(National_2016, Electoral_Votes_arranged)

forecast_data <- Electoral_Votes %>% 
  left_join(State_Summary_2016) %>% 
  left_join(State_Summary_2020)

forecast_data <- forecast_data %>% mutate(
  National_Adj = National_Spread_2020_Current - National_Spread_2016_Average,
  National_SD = National_Sd_2020,
  Spread = case_when(
    is.na(Spread_2020) ~ Spread_2016 + National_Adj,
    !is.na(Spread_2020) ~ (0.5*Spread_2020) + (0.5*(Spread_2016+National_Adj))
  ),
  Sd = case_when(
    is.na(Stdev_2016) & (is.na(Stdev_2020)|is.nan(Stdev_2020)|Stdev_2020 == 0) ~ National_SD,
    !is.na(Stdev_2016) & (is.na(Stdev_2020)|is.nan(Stdev_2020)) ~ Stdev_2016,
    !is.na(Stdev_2016) & !(is.na(Stdev_2020)|is.nan(Stdev_2020)) ~ (0.5*Stdev_2020) + (0.5*Stdev_2016),
    is.na(Stdev_2016) & !(is.na(Stdev_2020)|is.nan(Stdev_2020)) ~ (0.5*Stdev_2020) + (0.5*National_SD)
  )
)

n = 10000

results_matrix <- matrix(0, nrow = 54, ncol = n)

prior <- function(theta, alpha, beta){
  ifelse(theta > 0 & theta < 1, 1, 0)
}

likelihood <- function(theta, alpha, beta){
  dbeta(theta, alpha, beta)
}

posterior <- function(theta, alpha, beta){
  prior(theta, alpha, beta) * likelihood(theta, alpha, beta)
}

Dist <- list(
  gamma = 0,
  delta = 0.5,
  xi = 0.01,
  lambda = 1,
  type = "SN"
)

dist_multiplier <- rJohnson(n, Dist)

for(i in 1:54){
  results_matrix[i, ] <- forecast_data[i, 9] + dist_multiplier*forecast_data[i, 10]
}

trump_wins <- ifelse(results_matrix > 0, 1, 0)
trump_state_probs <- apply(trump_wins, 1, sum)/n
forecast_data$Trump_Prob <- trump_state_probs

biden_wins <- ifelse(results_matrix < 0, 1, 0)
biden_state_probs <- apply(biden_wins, 1, sum)/n
forecast_data$Biden_Prob <- biden_state_probs

votes <- matrix(Electoral_Votes$Votes, ncol = 1)

for(i in 1:n){
  trump_wins[ ,i] <- trump_wins[ ,i] * votes
  biden_wins[ ,i] <- biden_wins[ ,i] * votes
}

trump_votes <- apply(trump_wins, 2, sum)
biden_votes <- apply(biden_wins, 2, sum)

results <- data.frame(trump_votes, biden_votes)

results <- results %>% mutate(
  winner = ifelse(trump_votes >= biden_votes, "Trump", "Biden")
)

theta0 <- 0.5

mcmc <- function(alpha, beta, n, theta0){
  theta <- theta0
  theta_chain <- c()
  for(i in 1:n){
    theta_star <- rnorm(1, theta, 0.1)
    ifelse(runif(1) < posterior(theta_star, alpha, beta)/posterior(theta, alpha, beta), theta_star, theta)
    theta_chain <- c(theta_chain, theta)
  }
  return(theta_chain)
}

theta_chain <- mcmc(1, 1, 10000, 0.5)

ggplot(data.frame(dist_multiplier), aes(x = dist_multiplier)) +
  geom_histogram(binwidth = 0.1, fill = "orange") +
  stat_function(fun = dnorm, args = list(mean = 0, sd = 1), color = "blue", size = 1) + 
  labs(title = "Distribution of the Spread", x = "Spread", y = "Count") + 
  theme(plot.title = element_text(hjust = 0.5))

win_table <- results %>% 
  group_by(winner) %>% 
  tally() %>% 
  rename(Percent = n) %>% 
  mutate(Percent = Percent/n)



# Convert the data into long format
results_long <- data.frame(
  Votes = c(results$trump_votes, results$biden_votes),
  Candidate = factor(rep(c("Trump", "Biden"), each = nrow(results)))
)
# Histogram of Election Outcomes
ggplot(results_long, aes(x = Votes, fill = Candidate)) +
  geom_histogram(binwidth = 10, alpha = 0.5, position = "identity") +
  scale_fill_manual(values = c("Trump" = "red", "Biden" = "blue")) +
  labs(title = "Distribution of Electoral Votes Won by Each Candidate", x = "Electoral Votes", y = "Count") +
  theme(plot.title = element_text(hjust = 0.5))


# Probability Density Function (PDF) of Election Outcomes
ggplot(results_long, aes(x = Votes, fill = Candidate)) +
  geom_density(alpha = 0.5) +
  scale_fill_manual(values = c("Trump" = "red", "Biden" = "blue")) +
  labs(title = "Probability Density Function of Electoral Votes Won by Each Candidate", x = "Electoral Votes", y = "Density") +
  theme(plot.title = element_text(hjust = 0.5))


results %>% 
  group_by(winner) %>% 
  tally() %>% 
  rename(Percent = n) %>%   
  mutate(Percent = scales::percent(Percent/n, accuracy = 1.0))